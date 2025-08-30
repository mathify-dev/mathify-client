import React, { useState } from "react";
import {
  Modal,
  Button,
  Input,
  Form,
  Table,
  TimePicker,
  Tooltip,
  Spin,
} from "antd";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import makeRequest from "../apiClient";
import moment from "moment";

const { TextArea } = Input;

const AddStudentModal = ({ visible, onClose, fetchStudents }) => {
  const [rowNumber, setRowNumber] = useState("");
  const [studentData, setStudentData] = useState(null);
  const [feesPerHour, setFeesPerHour] = useState(null);
  const [schedule, setSchedule] = useState({
    Monday: { from: null, to: null },
    Tuesday: { from: null, to: null },
    Wednesday: { from: null, to: null },
    Thursday: { from: null, to: null },
    Friday: { from: null, to: null },
    Saturday: { from: null, to: null },
    Sunday: { from: null, to: null },
  });
  const [loading, setLoading] = useState(false);

  const handleRowNumberChange = (e) => setRowNumber(e.target.value);

  const fetchStudentDetails = async () => {
    setLoading(true);
    try {
      const response = await makeRequest(
        "post",
        "/api/students/fetchStudentDetailsFromSheet",
        {
          rowNumber: rowNumber,
        }
      );
      setStudentData(response.data);
    } catch (error) {
      console.error("Error fetching student details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTimeChange = (day, timeType, value) => {
    setSchedule({
      ...schedule,
      [day]: {
        ...schedule[day],
        [timeType]: value ? value.format("HH:mm") : null,
      },
    });
  };

  const handleSubmit = async () => {
    // Create a filtered schedule that only includes days with non-null times
    const filteredSchedule = Object.keys(schedule).reduce((acc, day) => {
      if (schedule[day].from && schedule[day].to) {
        acc[day] = schedule[day];
      }
      return acc;
    }, {});

    const studentPayload = {
      ...studentData,
      feesPerHour: parseFloat(feesPerHour), // Ensure it's sent as a number
      schedule: filteredSchedule, // Only send days with valid times
    };

    try {
      const response = await makeRequest(
        "post",
        "/api/students/createNewStudent",
        studentPayload
      );

      console.log("successful", response);
      onClose(); // Close modal after successful student creation
      fetchStudents();
    } catch (error) {
      console.error("Error creating student:", error);
    }
  };

  return (
    <Modal
      visible={visible}
      title="Add New Student"
      onCancel={onClose}
      footer={null}
      width={700}
    >
      <Form layout="vertical">
        <Form.Item label="Row Number" required>
          <Input
            type="number"
            value={rowNumber}
            onChange={handleRowNumberChange}
            placeholder="Enter row number"
            maxLength={5}
          />
        </Form.Item>

        <Button
          type="primary"
          onClick={fetchStudentDetails}
          disabled={!rowNumber}
        >
          Fetch Student
        </Button>

        {loading ? (
          <div className="flex justify-center my-6">
            <Spin />
          </div>
        ) : studentData ? (
          <>
            {/* Student Information */}
            <div className="mt-4">
              <h3>Student Information</h3>
              <div className="p-6">
                {/* Student Details */}
                <div className="flex flex-wrap gap-x-12 gap-y-4 text-sm text-gray-700">
                  <div>
                    <p className="font-semibold text-gray-500">Name</p>
                    <p>{studentData?.name || "-"}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-500">Email</p>
                    <p>{studentData?.email || "-"}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-500">Phone</p>
                    <p>{studentData?.phone || "-"}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-500">Parents Name</p>
                    <p>{studentData?.parentsName || "-"}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-500">Date of Birth</p>
                    <p>{studentData?.dateOfBirth || "-"}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-500">Gender</p>
                    <p>{studentData?.gender || "-"}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-500">
                      Mode of Learning
                    </p>
                    <p>{studentData?.preferredModeOfLearning || "-"}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-500">
                      Objective of Enrolling
                    </p>
                    <p>{studentData?.objectiveOfEnrolling || "-"}</p>
                  </div>
                </div>
              </div>

              {/* Fee Per Hour */}
              <Form.Item label="Fee Per Hour" required>
                <Input
                  type="number"
                  value={feesPerHour}
                  onChange={(e) => setFeesPerHour(e.target.value)}
                  placeholder="Enter fee per hour"
                />
              </Form.Item>

              {/* Schedule Table */}
              <h3>Schedule</h3>
              <Table
                dataSource={Object.keys(schedule).map((day) => ({
                  key: day,
                  day,
                  from: schedule[day].from,
                  to: schedule[day].to,
                }))}
                columns={[
                  { title: "Day", dataIndex: "day", key: "day" },
                  {
                    title: "Start Time",
                    dataIndex: "from",
                    key: "from",
                    render: (text, record) => (
                      <TimePicker
                        value={
                          record.from ? moment(record.from, "HH:mm") : null
                        }
                        onChange={(value) =>
                          handleTimeChange(record.day, "from", value)
                        }
                        format="HH:mm"
                        minuteStep={15}
                      />
                    ),
                  },
                  {
                    title: "End Time",
                    dataIndex: "to",
                    key: "to",
                    render: (text, record) => (
                      <TimePicker
                        value={record.to ? moment(record.to, "HH:mm") : null}
                        onChange={(value) =>
                          handleTimeChange(record.day, "to", value)
                        }
                        format="HH:mm"
                        minuteStep={15}
                      />
                    ),
                  },
                ]}
                pagination={false}
                bordered
                size="small"
              />
            </div>

            <div className="flex justify-end mt-6">
              <Button onClick={onClose} style={{ marginRight: 10 }}>
                Cancel
              </Button>
              <Button
                type="primary"
                onClick={handleSubmit}
                disabled={
                  !feesPerHour ||
                  !Object.values(schedule).some((time) => time.from && time.to)
                }
              >
                Submit
              </Button>
            </div>
          </>
        ) : null}
      </Form>
    </Modal>
  );
};

export default AddStudentModal;
