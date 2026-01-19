import React, { useEffect, useState } from "react";
import { Table, Button, Input, Tooltip, Avatar, Spin } from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  WalletOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import makeRequest from "./apiClient";
import AddStudentModal from "./components/AddStudentModal";
import StudentAttendanceModal from "./components/StudentAttendanceModal";
import StudentDetailsModal from "./components/StudentDetailsModal";
import StudentFeesModal from "./components/StudentFeesModal";

const BASE_URL = import.meta.env.VITE_BASE_URL || "http://localhost:5173";

const AdminDashboard = ({ user }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [attendanceModalOpen, setAttendanceModalVisible] = useState(false);
  const [feesModalOpen, setFeesModalVisible] = useState(false);
  const [selectedStudentIdForFees, setSelectedStudentIdForFees] = useState(null);

  const handleAddStudent = () => setModalVisible(true);
  const handleCloseModal = () => setModalVisible(false);

  const handleAttendanceModalOpen = (studentId) => {
    console.log("attendance modal", studentId);
    setSelectedStudentId(studentId);
    setAttendanceModalVisible(true);
  };

  const handleAttendanceModalClose = () => {
    setSelectedStudentId(null);
    setAttendanceModalVisible(false);
  };

  const handleFeesModalOpen = (studentId) => {
    setSelectedStudentIdForFees(studentId);
    setFeesModalVisible(true);
  };

  const handleFeesModalClose = () => {
    setSelectedStudentIdForFees(null);
    setFeesModalVisible(false);
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = `${BASE_URL}`;
  };

  const fetchAllStudents = async () => {
    setLoading(true);
    try {
      const response = await makeRequest(
        "get",
        "/api/students/fetchAllStudents"
      );
      for (let student = 0; student < response.length; student++) {
        response[student].key = student + 1;
      }
      setStudents(response || []);
    } catch (error) {
      console.error("Failed to fetch students:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const filteredStudents = students.filter((student) => {
    const searchStr = searchQuery.toLowerCase();
    return (
      student.name.toLowerCase().includes(searchStr) ||
      student.email.toLowerCase().includes(searchStr) ||
      student.key.toString().includes(searchStr)
    );
  });

  useEffect(() => {
    fetchAllStudents();
  }, []);

  const columns = [
    { title: "ID", dataIndex: "key", key: "key" },
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Email", dataIndex: "email", key: "email" },
    {
      title: "Actions",
      key: "actions",
      render: (_, student) => (
        <div className="flex space-x-3">
          <Tooltip title="View Details">
            <EyeOutlined
              className="cursor-pointer text-blue-500"
              onClick={() => setSelectedStudent(student)}
            />
          </Tooltip>
          <Tooltip title="Attendance">
            <CheckCircleOutlined
              className="cursor-pointer text-green-500"
              onClick={() => handleAttendanceModalOpen(student._id)}
            />
          </Tooltip>
          <Tooltip title="Fee Records">
            <WalletOutlined 
              className="cursor-pointer text-orange-500" 
              onClick={() => handleFeesModalOpen(student._id)}
            />
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-4 rounded shadow-sm mb-6">
        <h1 className="text-lg font-semibold text-black">Mathify</h1>
        <div className="flex items-center gap-4 text-black">
          <span>{user?.name || "Admin"}</span>
          <Avatar src={user?.avatar} />
          <Tooltip title="Logout">
            <LogoutOutlined
              className="text-lg cursor-pointer hover:text-red-500"
              onClick={handleLogout}
            />
          </Tooltip>
        </div>
      </div>

      {/* Add Student and Search */}
      <div className="flex justify-between items-center mb-6">
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAddStudent}
        >
          Add Student
        </Button>
        <Input
          placeholder="Search by ID, Name, or Email"
          prefix={<SearchOutlined />}
          value={searchQuery}
          onChange={handleSearch}
          style={{ width: 300 }}
        />
      </div>

      {/* Students Table */}
      {loading ? (
        <div className="flex justify-center my-6">
          <Spin />
        </div>
      ) : (
        <Table
          dataSource={filteredStudents}
          columns={columns}
          rowKey="_id"
          pagination={10}
        />
      )}
      <AddStudentModal
        visible={modalVisible}
        onClose={handleCloseModal}
        fetchStudents={fetchAllStudents}
      />
      <StudentAttendanceModal
        open={attendanceModalOpen}
        onClose={handleAttendanceModalClose}
        studentId={selectedStudentId}
      />
      <StudentFeesModal
        open={feesModalOpen}
        onClose={handleFeesModalClose}
        studentId={selectedStudentIdForFees}
      />
      <StudentDetailsModal
        open={selectedStudent !== null}
        onClose={() => setSelectedStudent(null)}
        student={selectedStudent}
      />
    </div>
  );
};

export default AdminDashboard;
