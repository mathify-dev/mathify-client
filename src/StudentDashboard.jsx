import React, { useEffect, useState } from "react";
import { Tabs, Tag, Avatar, Spin, Table, Empty, Tooltip, Button, message } from "antd";
import { LogoutOutlined, DownloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import makeRequest from "./apiClient";

const BASE_URL = import.meta.env.VITE_BASE_URL || "http://localhost:5173";
const { TabPane } = Tabs;

const StudentDashboard = ({ user }) => {
  const [studentDetails, setStudentDetails] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [feeRecords, setFeeRecords] = useState(null);
  const [loadingStudent, setLoadingStudent] = useState(false);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [loadingFees, setLoadingFees] = useState(false);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = `${BASE_URL}`;
  };

  const fetchStudentDetails = async () => {
    setLoadingStudent(true);
    try {
      const response = await makeRequest(
        "get",
        `/api/students/fetchStudent/${user?.id}`
      );
      setStudentDetails(response || null);
    } catch (error) {
      console.error("Failed to fetch student details:", error);
    } finally {
      setLoadingStudent(false);
    }
  };

  const fetchAttendance = async () => {
    setLoadingAttendance(true);
    try {
      const response = await makeRequest(
        "get",
        `/api/attendance/getAttendance/${user?.id}`
      );
      setAttendance(response?.data || []);
    } catch (error) {
      console.error("Failed to fetch attendance:", error);
    } finally {
      setLoadingAttendance(false);
    }
  };

  const fetchFeeRecords = async () => {
    setLoadingFees(true);
    try {
      const response = await makeRequest(
        "get",
        `/api/fees/getStudentFees/${user?.id}`
      );
      setFeeRecords(response || null);
    } catch (error) {
      console.error("Failed to fetch fee records:", error);
    } finally {
      setLoadingFees(false);
    }
  };

  const handleDownloadInvoice = async (month) => {
    try {
      const response = await makeRequest(
        "get",
        `/api/fees/generateInvoice/${user?.id}`,
        null,
        { month },
        { responseType: 'blob' }
      );
      
      // Create a blob link to download
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      const fileName = `invoice-${user?.id}-${month}.pdf`;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Failed to download invoice:", error);
      message.error("Failed to download invoice");
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchStudentDetails();
      fetchAttendance();
      fetchFeeRecords();
    }
  }, [user?.id]);

  return (
    <div className="w-full min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-4 rounded shadow-sm mb-6">
        <h1 className="text-lg font-semibold text-black">Mathify</h1>
        <div className="flex items-center gap-4 text-black">
          <span>{user?.name || "Student"}</span>
          <Avatar src={user?.avatar} />
          <Tooltip title="Logout">
            <LogoutOutlined
              className="text-lg cursor-pointer hover:text-red-500"
              onClick={handleLogout}
            />
          </Tooltip>
        </div>
      </div>

      {/* Student Details */}
      {loadingStudent ? (
        <div className="flex justify-center my-6">
          <Spin />
        </div>
      ) : studentDetails ? (
        <div className="bg-white p-6 rounded shadow-sm mb-6">
          <div className="flex flex-wrap gap-x-12 gap-y-4 text-sm text-gray-700">
            <div>
              <p className="font-semibold text-gray-500">Name</p>
              <p>{studentDetails?.name || "-"}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-500">Email</p>
              <p>{studentDetails?.email || "-"}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-500">Phone</p>
              <p>{studentDetails?.phone || "-"}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-500">Fees Per Hour</p>
              <p>₹{studentDetails?.feesPerHour || 0}</p>
            </div>
          </div>

          {/* Schedule Table */}
          {studentDetails?.schedule && (
            <div className="mt-6">
              <p className="font-semibold text-gray-500 mb-2">Schedule</p>
              <Table
                dataSource={Object.entries(studentDetails?.schedule || {}).map(
                  ([day, time]) => ({
                    key: day,
                    day,
                    from: time?.from || "-",
                    to: time?.to || "-",
                  })
                )}
                columns={[
                  { title: "Day", dataIndex: "day", key: "day" },
                  { title: "From", dataIndex: "from", key: "from" },
                  { title: "To", dataIndex: "to", key: "to" },
                ]}
                pagination={false}
                bordered
                size="small"
              />
            </div>
          )}
        </div>
      ) : null}

      {/* Tabs */}
      <Tabs defaultActiveKey="1">
        {/* Attendance */}
        <TabPane tab="Attendance" key="1">
          {loadingAttendance ? (
            <div className="flex justify-center my-6">
              <Spin />
            </div>
          ) : !attendance || attendance.length === 0 ? (
            <Empty description="No attendance records." />
          ) : (
            <div className="space-y-4">
              {attendance?.map((record) => (
                <div
                  key={record?._id}
                  className="bg-white p-3 rounded shadow-sm grid grid-cols-4 gap-4 items-center"
                >
                  <p className="font-medium">
                    {record?.date ? dayjs(record.date).format("DD MMM YYYY") : "-"}
                  </p>
                  <p className="text-sm text-gray-500">
                    {record?.startTime || "-"} - {record?.endTime || "-"}
                  </p>
                  <p className="text-sm text-gray-500">{record?.hours || 0} hrs</p>
                  <div className="justify-self-start">
                    <Tag color={record?.isPresent ? "green" : "red"}>
                      {record?.isPresent ? "Present" : "Absent"}
                    </Tag>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabPane>

        {/* Fee Records */}
        <TabPane tab="Fee Records" key="2">
          {loadingFees ? (
            <div className="flex justify-center my-6">
              <Spin />
            </div>
          ) : !feeRecords?.feesSummary || feeRecords?.feesSummary.length === 0 ? (
            <Empty description="No fee records found." />
          ) : (
            <div className="space-y-4">
              {feeRecords?.feesSummary?.map((details) => (
                <div
                  key={details?.billingMonth}
                  className="bg-white p-3 rounded shadow-sm grid grid-cols-5 gap-4 items-center"
                >
                  <p className="font-medium">
                    {details?.billingMonth
                      ? dayjs(details.billingMonth, "YYYY-MM").format("MMMM YYYY")
                      : "-"}
                  </p>
                  <p className="text-sm text-gray-500">
                    Hours: {details?.totalHours || 0}
                  </p>
                  <p className="text-sm text-gray-500">₹{details?.payableAmount || 0}</p>
                  <div className="flex flex-col items-start justify-self-start">
                    <Tag color={details?.isSettled ? "green" : "orange"}>
                      {details?.isSettled ? "Paid" : "Pending"}
                    </Tag>
                    {details?.isSettled && details?.paidOn && (
                      <p className="text-xs text-gray-400">
                        {dayjs(details.paidOn).format("DD MMM YYYY")} via {details?.paymentMethod || "-"}
                      </p>
                    )}
                  </div>
                  <div className="justify-self-end">
                    <Tooltip title="Download Invoice">
                      <Button 
                        type="text" 
                        icon={<DownloadOutlined className="text-blue-600" />} 
                        onClick={() => handleDownloadInvoice(details.billingMonth)}
                      />
                    </Tooltip>
                  </div>
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
