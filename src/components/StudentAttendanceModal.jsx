import React, { useEffect, useRef, useState } from "react";
import {
  App,
  Modal,
  Button,
  Tag,
  DatePicker,
  TimePicker,
  Spin,
  Alert,
} from "antd";
import { EditOutlined, DeleteOutlined, PlayCircleOutlined, StopOutlined } from "@ant-design/icons";
import makeRequest from "../apiClient";
import dayjs from "dayjs";

// ─── Time helpers ─────────────────────────────────────────────────────────────

/** Round a dayjs object DOWN to the previous 30-minute mark */
const roundDownTo30 = (d) => {
  const m = d.minute();
  return d.minute(m < 30 ? 0 : 30).second(0).millisecond(0);
};

/** Round a dayjs object to the TRUE nearest 15-minute mark */
const roundToNearest15 = (d) => {
  const m = d.minute();
  const remainder = m % 15;
  const rounded = remainder < 8 ? m - remainder : m + (15 - remainder);
  return d.minute(rounded).second(0).millisecond(0);
};

/** Parse "HH:mm" string → total minutes since midnight */
const toMinutes = (hhmm) => {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

/** Extract the most useful error message from an Axios error */
const getErrorMessage = (error) =>
  error?.response?.data?.error ||
  error?.response?.data?.message ||
  error?.message ||
  "Something went wrong. Please try again.";

/** Get today as "YYYY-MM-DD" in local time */
const todayStr = () => dayjs().format("YYYY-MM-DD");

// ─── Component ────────────────────────────────────────────────────────────────

const StudentAttendanceModal = ({ open, onClose, studentId }) => {
  const { notification } = App.useApp();

  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(false);

  // ── Form state ──────────────────────────────────────────────────────────────
  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null); // null = add mode
  const [formDate, setFormDate] = useState(null);
  const [formStartTime, setFormStartTime] = useState(null);
  const [formEndTime, setFormEndTime] = useState(null);
  const [formIsPresent, setFormIsPresent] = useState(true);
  const [saving, setSaving] = useState(false);

  // ── Active session state ─────────────────────────────────────────────────────
  // { id, startTime: "HH:mm", date: "YYYY-MM-DD" }  |  null
  const [activeSession, setActiveSession] = useState(null);
  const [sessionStarting, setSessionStarting] = useState(false);
  const [sessionEnding, setSessionEnding] = useState(false);

  // ── Forced-edit warning (forgot to end) ─────────────────────────────────────
  const [forgotEndWarning, setForgotEndWarning] = useState(false);

  // ── Delete confirmation ──────────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState(null); // record object
  const [deleting, setDeleting] = useState(false);

  // Interval ref for 3-hour check while modal is open
  const intervalRef = useRef(null);

  // ── On modal open/close ──────────────────────────────────────────────────────
  useEffect(() => {
    if (open && studentId) {
      fetchAttendanceData();
    } else {
      // Clean up when modal closes
      clearInterval(intervalRef.current);
      resetForm();
      setActiveSession(null);
      setForgotEndWarning(false);
      setDeleteTarget(null);
    }
  }, [open, studentId]);

  // ── Start 3-hour interval check whenever activeSession changes ───────────────
  useEffect(() => {
    clearInterval(intervalRef.current);
    if (activeSession) {
      intervalRef.current = setInterval(() => checkForForgottenEnd(activeSession), 60_000);
    }
    return () => clearInterval(intervalRef.current);
  }, [activeSession]);

  // ─── Fetch ───────────────────────────────────────────────────────────────────

  const fetchAttendanceData = async () => {
    setLoading(true);
    try {
      const response = await makeRequest(
        "get",
        `/api/attendance/getAttendance/${studentId}`
      );
      const records = response.data || [];
      setAttendance(records);
      detectActiveSession(records);
    } catch (error) {
      notification.error({
        message: "Error fetching attendance",
        description: getErrorMessage(error),
      });
    } finally {
      setLoading(false);
    }
  };

  // ─── Active session detection ─────────────────────────────────────────────

  const detectActiveSession = (records) => {
    if (!records.length) return;

    // Find the open session (no endTime) — should be records[0] after correct
    // sort, but we scan all records as a safety net in case of sort issues.
    const openRecord = records.find((r) => !r.endTime);
    if (openRecord) {
      const session = {
        id: openRecord._id,
        startTime: openRecord.startTime,
        date: dayjs(openRecord.date).format("YYYY-MM-DD"),
      };
      setActiveSession(session);
      checkForForgottenEnd(session);
    } else {
      setActiveSession(null);
    }
  };

  /** If the open session started > 3 hours ago, flag the warning.
   *  The form is NOT auto-opened — the admin sees a banner and clicks
   *  "Complete Record" to open the pre-filled form themselves. */
  const checkForForgottenEnd = (session) => {
    if (!session) return;
    const nowMinutes = toMinutes(dayjs().format("HH:mm"));
    const startMinutes = toMinutes(session.startTime);
    if (nowMinutes - startMinutes >= 180) {
      setForgotEndWarning(true);
    }
  };

  // ─── Form helpers ─────────────────────────────────────────────────────────

  const resetForm = () => {
    setFormOpen(false);
    setFormDate(null);
    setFormStartTime(null);
    setFormEndTime(null);
    setFormIsPresent(true);
    setEditingRecord(null);
    setForgotEndWarning(false);
  };

  const openEditForm = (record) => {
    setEditingRecord(record);
    // record.date may be an ISO string (from DB) or "YYYY-MM-DD" (from activeSession)
    setFormDate(dayjs(record.date));
    setFormStartTime(dayjs(`2000-01-01T${record.startTime}:00`));
    setFormEndTime(record.endTime ? dayjs(`2000-01-01T${record.endTime}:00`) : null);
    setFormIsPresent(record.isPresent ?? true);
    setFormOpen(true);
  };

  const handleAddAttendanceClick = () => {
    resetForm();
    setFormOpen(true);
  };

  const handleCancelForm = () => {
    setFormOpen(false);
    resetForm();
  };

  // ─── Same-day active-session validation for the manual form ──────────────

  const validateFormAgainstActiveSession = () => {
    if (!activeSession) return true;
    if (!formDate) return true;

    const formDateStr = formDate.format("YYYY-MM-DD");
    if (formDateStr !== activeSession.date) return true; // different day — fine

    const activeStartMin = toMinutes(activeSession.startTime);
    const newStartMin = formStartTime ? toMinutes(formStartTime.format("HH:mm")) : null;
    const newEndMin = formEndTime ? toMinutes(formEndTime.format("HH:mm")) : null;

    // If editing the active session record itself, allow
    if (editingRecord && editingRecord._id === activeSession.id) return true;

    if (newStartMin === null || newEndMin === null) return true; // let backend validate

    if (newStartMin >= activeStartMin || newEndMin > activeStartMin) {
      notification.error({
        message: "Active Session Conflict",
        description: `A class is currently in progress since ${activeSession.startTime}. You can only add records with both start and end times before ${activeSession.startTime}.`,
        duration: 6,
      });
      return false;
    }
    return true;
  };

  // ─── Save (add or update) ─────────────────────────────────────────────────

  const handleSaveForm = async () => {
    if (!formStartTime || !formDate) {
      notification.error({
        message: "Missing Fields",
        description: "Date and Start Time are required.",
      });
      return;
    }

    // End Time is always required — especially when completing an active session
    if (!formEndTime) {
      notification.error({
        message: "End Time Required",
        description:
          editingRecord?._id === activeSession?.id
            ? "Please set an end time to complete this session."
            : "End Time is required.",
      });
      return;
    }

    if (!validateFormAgainstActiveSession()) return;

    const payload = {
      startTime: formStartTime.format("HH:mm"),
      endTime: formEndTime ? formEndTime.format("HH:mm") : undefined,
      date: formDate.format("YYYY-MM-DD"),
      isPresent: formIsPresent,
    };

    setSaving(true);
    try {
      if (editingRecord) {
        // PUT — update existing record (includes ending active session from the form)
        await makeRequest(
          "put",
          `/api/attendance/updateAttendance/${editingRecord._id}`,
          payload
        );
        notification.success({ message: "Attendance updated successfully" });
        // If this was the active session, clear it
        if (editingRecord._id === activeSession?.id) {
          setActiveSession(null);
        }
      } else {
        // POST — new record
        await makeRequest("post", "/api/attendance/addAttendance", {
          ...payload,
          studentId,
        });
        notification.success({ message: "Attendance added successfully" });
      }

      await fetchAttendanceData();
      setFormOpen(false);
      resetForm();
    } catch (error) {
      notification.error({
        message: editingRecord ? "Error updating attendance" : "Error adding attendance",
        description: getErrorMessage(error),
        duration: 7,
      });
    } finally {
      setSaving(false);
    }
  };

  // ─── Quick Start ──────────────────────────────────────────────────────────

  const handleStart = async () => {
    const startTime = roundDownTo30(dayjs()).format("HH:mm");
    const date = todayStr();

    setSessionStarting(true);
    try {
      const response = await makeRequest("post", "/api/attendance/addAttendance", {
        studentId,
        startTime,
        date,
        isPresent: true,
      });
      const newRecord = response.data;
      setActiveSession({ id: newRecord._id, startTime, date });
      await fetchAttendanceData();
      notification.success({
        message: "Class Started",
        description: `Session started at ${startTime}. Press "End" when the class is over.`,
      });
    } catch (error) {
      notification.error({
        message: "Failed to start session",
        description: getErrorMessage(error),
        duration: 7,
      });
    } finally {
      setSessionStarting(false);
    }
  };

  // ─── Quick End ────────────────────────────────────────────────────────────

  const handleEnd = async () => {
    if (!activeSession) return;

    const endTime = roundToNearest15(dayjs()).format("HH:mm");
    const startMin = toMinutes(activeSession.startTime);
    const endMin = toMinutes(endTime);

    if (endMin <= startMin) {
      notification.error({
        message: "Invalid End Time",
        description: `The calculated end time (${endTime}) is not after the start time (${activeSession.startTime}). Please use the edit form to set the end time manually.`,
        duration: 7,
      });
      return;
    }

    setSessionEnding(true);
    try {
      await makeRequest(
        "put",
        `/api/attendance/updateAttendance/${activeSession.id}`,
        { endTime }
      );
      notification.success({
        message: "Class Ended",
        description: `Session ended at ${endTime}.`,
      });
      setActiveSession(null);
      setForgotEndWarning(false);
      await fetchAttendanceData();
    } catch (error) {
      notification.error({
        message: "Failed to end session",
        description: getErrorMessage(error),
        duration: 7,
      });
    } finally {
      setSessionEnding(false);
    }
  };

  // ─── Delete ───────────────────────────────────────────────────────────────

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await makeRequest(
        "delete",
        `/api/attendance/deleteAttendance/${deleteTarget._id}`
      );
      notification.success({ message: "Attendance record deleted." });
      // If we deleted the active session, clear it
      if (deleteTarget._id === activeSession?.id) {
        setActiveSession(null);
      }
      setDeleteTarget(null);
      await fetchAttendanceData();
    } catch (error) {
      notification.error({
        message: "Failed to delete record",
        description: getErrorMessage(error),
        duration: 7,
      });
    } finally {
      setDeleting(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  const isSaveEnabled = !!(formDate && formStartTime && formEndTime);

  return (
    <>
      <Modal
        title="Student Attendance"
        open={open}
        onCancel={onClose}
        footer={null}
        width={820}
      >
        {loading ? (
          <div className="flex justify-center items-center py-10">
            <Spin size="large" />
          </div>
        ) : (
          <div className="space-y-4">

            {/* ── Top action bar ─────────────────────────────────────── */}
            <div className="flex items-center gap-3 mt-4 flex-wrap">
              {/* Quick Start / End */}
              {!activeSession ? (
                <Button
                  type="primary"
                  icon={<PlayCircleOutlined />}
                  onClick={handleStart}
                  loading={sessionStarting}
                  style={{ backgroundColor: "#16a34a", borderColor: "#16a34a" }}
                >
                  Start
                </Button>
              ) : (
                <Button
                  type="primary"
                  danger
                  icon={<StopOutlined />}
                  onClick={handleEnd}
                  loading={sessionEnding}
                >
                  End &nbsp;
                  <span className="text-xs font-normal opacity-80">
                    (since {activeSession.startTime})
                  </span>
                </Button>
              )}

              {/* Manual add — hidden while forced-edit warning is shown or form is open */}
              {!forgotEndWarning && !formOpen && (
                <Button onClick={handleAddAttendanceClick}>
                  Add Attendance
                </Button>
              )}
            </div>

            {/* ── Forgot-end warning banner ──────────────────────────── */}
            {forgotEndWarning && !formOpen && (
              <Alert
                type="warning"
                showIcon
                message="Looks like you forgot to mark the end of the last class"
                description={
                  <div>
                    <p>
                      A class was started at <strong>{activeSession?.startTime}</strong> and was
                      never ended. Please complete the record.
                    </p>
                    <Button
                      size="small"
                      type="primary"
                      className="mt-2"
                      onClick={() => {
                        // Find the actual record object from the attendance list
                        const record = attendance.find((r) => r._id === activeSession?.id);
                        openEditForm(
                          record || {
                            _id: activeSession.id,
                            startTime: activeSession.startTime,
                            date: activeSession.date,
                            isPresent: true,
                          }
                        );
                      }}
                    >
                      Complete Record
                    </Button>
                  </div>
                }
                className="mt-2"
              />
            )}

            {/* ── Add / Edit form ────────────────────────────────────── */}
            {formOpen && (
              <div className="space-y-3 mt-3 p-4 border rounded bg-gray-50">
                {editingRecord && (
                  <p className="text-sm font-semibold text-blue-600">
                    {editingRecord._id === activeSession?.id
                      ? "⚠️ Completing active session"
                      : "✏️ Editing attendance record"}
                  </p>
                )}

                <div>
                  <label className="block text-sm mb-1">Date</label>
                  <DatePicker
                    className="w-full"
                    value={formDate}
                    onChange={(val) => setFormDate(val)}
                    format="YYYY-MM-DD"
                    disabled={!!forgotEndWarning} // lock date when forced-editing
                  />
                </div>

                <div>
                  <label className="block text-sm mb-1">Start Time</label>
                  <TimePicker
                    className="w-full"
                    value={formStartTime}
                    onChange={(t) => setFormStartTime(t)}
                    format="HH:mm"
                    disabled={!!forgotEndWarning} // lock start when forced-editing
                  />
                </div>

                <div>
                  <label className="block text-sm mb-1">
                    End Time
                    {editingRecord?._id === activeSession?.id && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </label>
                  <TimePicker
                    className="w-full"
                    value={formEndTime}
                    onChange={(t) => setFormEndTime(t)}
                    format="HH:mm"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-1">Status</label>
                  <select
                    className="w-full p-2 border rounded"
                    value={formIsPresent ? "Present" : "Absent"}
                    onChange={(e) => setFormIsPresent(e.target.value === "Present")}
                  >
                    <option value="Present">Present</option>
                    <option value="Absent">Absent</option>
                  </select>
                </div>

                <div className="flex gap-3 mt-2">
                  {/* Hide Cancel when the forgot-end form is forced open */}
                  {!forgotEndWarning && (
                    <Button onClick={handleCancelForm} className="flex-1">
                      Cancel
                    </Button>
                  )}
                  <Button
                    type="primary"
                    onClick={handleSaveForm}
                    disabled={!isSaveEnabled}
                    loading={saving}
                    className="flex-1"
                  >
                    {editingRecord ? "Update" : "Save"}
                  </Button>
                </div>
              </div>
            )}

            {/* ── Attendance records list ────────────────────────────── */}
            {attendance.length > 0 ? (
              attendance.map((record) => {
                const isOpen = !record.endTime;
                return (
                  <div
                    key={record._id}
                    className={`bg-white p-3 rounded shadow-sm grid grid-cols-5 gap-3 items-center ${
                      isOpen ? "border border-yellow-400" : ""
                    }`}
                  >
                    {/* Date */}
                    <p className="font-medium text-sm">
                      {record.date ? dayjs(record.date).format("DD MMM YYYY") : "-"}
                    </p>

                    {/* Times */}
                    <p className="text-sm text-gray-500">
                      {record.startTime || "-"}
                      {" → "}
                      {record.endTime || (
                        <span className="text-yellow-600 font-semibold">
                          In progress
                        </span>
                      )}
                    </p>

                    {/* Hours */}
                    <p className="text-sm text-gray-500">
                      {isOpen ? "—" : `${record.hours ?? 0} hrs`}
                    </p>

                    {/* Status */}
                    <Tag color={record.isPresent ? "green" : "red"}>
                      {record.isPresent ? "Present" : "Absent"}
                    </Tag>

                    {/* Actions */}
                    <div className="flex gap-2 justify-end">
                      <Button
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => openEditForm(record)}
                        title="Edit record"
                      />
                      <Button
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => setDeleteTarget(record)}
                        title="Delete record"
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-gray-400 text-sm">No attendance records found.</p>
            )}
          </div>
        )}
      </Modal>

      {/* ── Delete confirmation modal ──────────────────────────────────── */}
      <Modal
        title="Delete Attendance Record"
        open={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        footer={[
          <Button key="cancel" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>,
          <Button
            key="confirm"
            type="primary"
            danger
            loading={deleting}
            onClick={handleDeleteConfirm}
          >
            Yes, Delete
          </Button>,
        ]}
      >
        <p>
          Are you sure you want to delete the attendance record for{" "}
          <strong>
            {deleteTarget
              ? dayjs(deleteTarget.date).format("DD MMM YYYY")
              : ""}
          </strong>
          ?
        </p>
        <p className="text-red-500 text-sm mt-2">
          ⚠️ This action cannot be undone.
        </p>
        {deleteTarget?._id === activeSession?.id && (
          <Alert
            type="warning"
            showIcon
            message="This is the currently active session. Deleting it will also end the active session."
            className="mt-3"
          />
        )}
      </Modal>
    </>
  );
};

export default StudentAttendanceModal;
