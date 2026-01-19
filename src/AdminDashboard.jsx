import React, { useEffect, useState } from "react";
import { Table, Button, Input, Tooltip, Avatar, Spin, Modal } from "antd";
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

const BASE_URL = import.meta.env.VITE_BASE_URL || "http://localhost:5173";

const AdminDashboard = ({ user }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [attendanceModalOpen, setAttendanceModalVisible] = useState(false);

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
            <WalletOutlined className="cursor-pointer text-orange-500" />
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
      <Modal
        open={selectedStudent !== null}
        title="Student Details"
        onCancel={() => setSelectedStudent(null)}
        footer={null}
        width={700}
      >
        <div className="p-6">
          {/* Student Details */}
          <div className="flex flex-wrap gap-x-12 gap-y-4 text-sm text-gray-700">
            <div>
              <p className="font-semibold text-gray-500">Name</p>
              <p>{selectedStudent?.name || "-"}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-500">Email</p>
              <p>{selectedStudent?.email || "-"}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-500">Phone</p>
              <p>{selectedStudent?.phone || "-"}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-500">Parents Name</p>
              <p>{selectedStudent?.parentsName || "-"}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-500">Date of Birth</p>
              <p>{selectedStudent?.dateOfBirth || "-"}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-500">Gender</p>
              <p>{selectedStudent?.gender || "-"}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-500">Mode of Learning</p>
              <p>{selectedStudent?.preferredModeOfLearning || "-"}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-500">
                Objective of Enrolling
              </p>
              <p>{selectedStudent?.objectiveOfEnrolling || "-"}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-500">
                Examinations Targetting
              </p>
              <p>{selectedStudent?.examinationsTargetting || "-"}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-500">
                Desired Number of Hours
              </p>
              <p>{selectedStudent?.desiredNumberOfHours || "-"}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-500">Fees Per Hour</p>
              <p>₹{selectedStudent?.feesPerHour || 0}</p>
            </div>
          </div>
          {selectedStudent?.schedule && (
            <div className="mt-6">
              <p className="font-semibold text-gray-500 mb-2">Schedule</p>
              <Table
                dataSource={Object.entries(selectedStudent?.schedule || {}).map(
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
      </Modal>
    </div>
  );
};

export default AdminDashboard;
