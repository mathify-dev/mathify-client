import React, { useEffect, useState } from "react";
import { DatePicker, Tabs, Tag, Avatar, Spin, Divider, Empty } from "antd";
import { LogoutOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import makeRequest from "./apiClient";

const BASE_URL = import.meta.env.VITE_BASE_URL || "http://localhost:5173";

const { TabPane } = Tabs;

const StudentDashboard = ({ user }) => {
  const [selectedMonth, setSelectedMonth] = useState(dayjs());
  const [studentDetails, setStudentDetails] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [feeRecords, setFeeRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [feeLoading, setFeeLoading] = useState(false);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = `${BASE_URL}`;
  };

  const fetchStudentMonthData = async (month) => {
    setLoading(true);
    try {
      const monthYear = month.format("YYYY-MM");
      const studentId = user.id;
      const response = await makeRequest(
        "get",
        `/api/students/studentMonthDetails/${studentId}/${monthYear}`
      );
      setStudentDetails(response.student);
      setAttendance(response.attendance);
    } catch (error) {
      console.error("Failed to fetch student data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFeeRecords = async () => {
    setFeeLoading(true);
    const studentId = user.id;
    try {
      const response = await makeRequest(
        "get",
        `/api/fees/studentFeeRecords/${studentId}`
      );
      setFeeRecords(response);
    } catch (error) {
      console.error("Failed to fetch fee records:", error);
    } finally {
      setFeeLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentMonthData(selectedMonth);
  }, [selectedMonth]);

  useEffect(() => {
    fetchFeeRecords();
  }, []);

  return (
    <div className="w-full min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-4 rounded shadow-sm mb-6">
        <h1 className="text-lg font-semibold">Mathify</h1>
        <div className="flex items-center gap-4">
          <span>{user?.name}</span>
          <Avatar src={user?.avatar} />
          <LogoutOutlined
            className="text-lg cursor-pointer"
            onClick={handleLogout}
          />
        </div>
      </div>

      {/* Month Selector */}
      <div className="mb-4">
        <DatePicker
          picker="month"
          value={selectedMonth}
          onChange={(val) => setSelectedMonth(val)}
          format="YYYY-MM"
        />
      </div>

      {/* Student Details */}
      {loading ? (
        <div className="flex justify-center my-6">
          <Spin />
        </div>
      ) : studentDetails ? (
        <div className="bg-white p-6 rounded shadow-sm mb-6">
          <div className="flex flex-wrap gap-x-12 gap-y-4 text-sm text-gray-700">
            <div className="w-full sm:w-auto">
              <p className="font-semibold text-gray-500">Name</p>
              <p>{studentDetails.name}</p>
            </div>
            <div className="w-full sm:w-auto">
              <p className="font-semibold text-gray-500">Email</p>
              <p>{studentDetails.email}</p>
            </div>
            <div className="w-full sm:w-auto">
              <p className="font-semibold text-gray-500">Phone</p>
              <p>{studentDetails.phone}</p>
            </div>
            <div className="w-full sm:w-auto">
              <p className="font-semibold text-gray-500">Batch</p>
              <p>{studentDetails.batchName}</p>
            </div>
            <div className="w-full sm:w-auto">
              <p className="font-semibold text-gray-500">
                Total Classes Attended
              </p>
              <p>{studentDetails.totalClasses}</p>
            </div>
            <div className="w-full sm:w-auto">
              <p className="font-semibold text-gray-500">Total Hours</p>
              <p>{studentDetails.totalHours}</p>
            </div>
            <div className="w-full sm:w-auto">
              <p className="font-semibold text-gray-500">Fee Status</p>
              <Tag color={studentDetails.feesPaid ? "green" : "orange"}>
                {studentDetails.feesPaid ? "Paid" : "Pending"}
              </Tag>
            </div>
            <div className="w-full sm:w-auto">
              <p className="font-semibold text-gray-500">Fees This Month</p>
              <p>₹{studentDetails.feesDue}</p>
            </div>
          </div>
        </div>
      ) : null}

      {/* Tabs */}
      <Tabs defaultActiveKey="1">
        <TabPane tab="Attendance" key="1">
          {attendance.length === 0 ? (
            <Empty description="No attendance records." />
          ) : (
            <div className="space-y-4">
              {attendance.map((record, index) => (
                <div
                  key={index}
                  className="bg-white p-3 rounded shadow-sm flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium">
                      {dayjs(record.date).format("DD MMM YYYY")}
                    </p>
                    <p className="text-sm text-gray-500">
                      {record.hours} hour(s)
                    </p>
                  </div>
                  <Tag color={record.present ? "green" : "red"}>
                    {record.present ? "Present" : "Absent"}
                  </Tag>
                </div>
              ))}
            </div>
          )}
        </TabPane>

        <TabPane tab="Fee Records" key="2">
          {feeLoading ? (
            <div className="flex justify-center my-6">
              <Spin />
            </div>
          ) : feeRecords.length === 0 ? (
            <Empty description="No fee records found." />
          ) : (
            <div className="space-y-4">
              {feeRecords.map((fee, idx) => (
                <div
                  key={idx}
                  className="bg-white p-3 rounded shadow-sm flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium">
                      {dayjs(fee.month, "YYYY-MM").format("MMMM YYYY")}
                    </p>
                    <p className="text-sm text-gray-500">
                      ₹{fee.totalFeeExpected}
                    </p>
                  </div>
                  <Tag color={fee.feesPaid ? "green" : "orange"}>
                    {fee.feesPaid ? "Paid" : "Pending"}
                  </Tag>
                </div>
              ))}
            </div>
          )}
        </TabPane>
      </Tabs>
    </div>
  );
};

export default StudentDashboard;
