import React, { useEffect, useState } from "react";
import {
  Modal,
  Button,
  Input,
  Tag,
  DatePicker,
  notification,
  Spin,
} from "antd";
import makeRequest from "../apiClient"; // your custom API request function
import dayjs from "dayjs";
import { TimePicker } from "antd";

const StudentAttendanceModal = ({ open, onClose, studentId }) => {
  const [attendance, setAttendance] = useState([]);
  const [addingAttendance, setAddingAttendance] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [date, setDate] = useState(null);
  const [isPresent, setIsPresent] = useState(true);
  const [loading, setLoading] = useState(false); // Loading state for fetching attendance
  const [saving, setSaving] = useState(false); // Loading state for saving attendance

  useEffect(() => {
    if (open && studentId) {
      fetchAttendanceData();
    }
  }, [open, studentId]);

  const fetchAttendanceData = async () => {
    setLoading(true);
    try {
      const response = await makeRequest(
        "get",
        `/api/attendance/getAttendance/${studentId}`
      );
      setAttendance(response.data);
    } catch (error) {
      notification.error({
        message: "Error fetching attendance",
        description: error.message || "Failed to fetch attendance records.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddAttendanceClick = () => {
    setAddingAttendance(true);
  };

  const handleSaveAttendance = async () => {
    if (!startTime || !endTime || !date) {
      notification.error({
        message: "Missing Fields",
        description: "Please fill all the required fields.",
      });
      return;
    }

    const payload = {
      studentId,
      startTime: startTime.format("HH:mm"),
      endTime: endTime.format("HH:mm"),
      date: date.format("YYYY-MM-DD"),
      isPresent,
    };

    setSaving(true);
    try {
      const response = await makeRequest(
        "post",
        "/api/attendance/addAttendance",
        payload
      );
      notification.success({
        message: "Attendance added successfully",
        description: response.data.message || "Attendance added successfully",
      });
      fetchAttendanceData(); // Refresh the attendance data
      setAddingAttendance(false); // Close the add attendance form
      setStartTime(null); // Reset fields
      setEndTime(null);
      setDate(null);
      setIsPresent(true);
    } catch (error) {
      notification.error({
        message: "Error adding attendance",
        description: error.message || "Failed to add attendance.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancelAdd = () => {
    setAddingAttendance(false);
    setStartTime(null);
    setEndTime(null);
    setDate(null);
    setIsPresent(true);
  };

  const isSaveEnabled = startTime && endTime && date;

  return (
    <Modal
      title="Student Attendance"
      open={open}
      onCancel={onClose}
      footer={null}
      width={800}
    >
      {/* Displaying Attendance Records */}
      {loading ? (
        <div className="flex justify-center items-center">
          <Spin size="large" />
        </div>
      ) : (
        <div className="space-y-4">
          {!addingAttendance ? (
            <Button
              type="primary"
              className=" mt-4"
              onClick={handleAddAttendanceClick}
            >
              Add Attendance
            </Button>
          ) : (
            <div className="space-y-4 mt-4">
              <div>
                <label>Date</label>
                <DatePicker
                  className="w-full"
                  value={date}
                  onChange={(value) => setDate(value)}
                  format="YYYY-MM-DD"
                />
              </div>
              <div>
                <label>Start Time</label>
                <TimePicker
                  className="w-full"
                  value={startTime}
                  onChange={(time) => setStartTime(time)}
                  format="HH:mm"
                />
              </div>

              <div>
                <label>End Time</label>
                <TimePicker
                  className="w-full"
                  value={endTime}
                  onChange={(time) => setEndTime(time)}
                  format="HH:mm"
                />
              </div>

              <div>
                <label>Attendance Status</label>
                <select
                  className="w-full p-2 border rounded"
                  value={isPresent ? "Present" : "Absent"}
                  onChange={(e) => setIsPresent(e.target.value === "Present")}
                >
                  <option value="Present">Present</option>
                  <option value="Absent">Absent</option>
                </select>
              </div>

              <div className="flex space-x-4 mt-4">
                <Button onClick={handleCancelAdd} className="w-full">
                  Cancel
                </Button>
                <Button
                  type="primary"
                  onClick={handleSaveAttendance}
                  disabled={!isSaveEnabled}
                  loading={saving} // Show loader when saving
                  className="w-full"
                >
                  Save
                </Button>
              </div>
            </div>
          )}
          {attendance.length > 0 ? (
            attendance.map((record) => (
              <div
                key={record._id}
                className="bg-white p-3 rounded shadow-sm grid grid-cols-4 gap-4 items-center"
              >
                <p className="font-medium">
                  {record.date ? dayjs(record.date).format("DD MMM YYYY") : "-"}
                </p>
                <p className="text-sm text-gray-500">
                  {record.startTime || "-"} - {record.endTime || "-"}
                </p>
                <p className="text-sm text-gray-500">{record.hours || 0} hrs</p>
                <div className="justify-self-start">
                  <Tag color={record.isPresent ? "green" : "red"}>
                    {record.isPresent ? "Present" : "Absent"}
                  </Tag>
                </div>
              </div>
            ))
          ) : (
            <p>No attendance records found.</p>
          )}
        </div>
      )}

      {/* Add Attendance Button */}
    </Modal>
  );
};

export default StudentAttendanceModal;
