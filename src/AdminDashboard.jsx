import React, { useState } from "react";
import {
  Table,
  Tag,
  Select,
  Card,
  Avatar,
  Modal,
  Form,
  InputNumber,
  Button,
  Tooltip,
  DatePicker,
} from "antd";
import {
  UserOutlined,
  LogoutOutlined,
  DollarOutlined,
  CheckCircleTwoTone,
  CloseCircleTwoTone,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Option } = Select;

export default function AdminDashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [calculatedFee, setCalculatedFee] = useState(0);
  const [studentFeeStatus, setStudentFeeStatus] = useState("Pending");
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [selectedDate, setSelectedDate] = useState(dayjs());

  const [attendanceData, setAttendanceData] = useState([
    {
      key: "1",
      name: "Sarah Wilson",
      email: "sarah@example.com",
      avatar: "https://randomuser.me/api/portraits/women/65.jpg",
      isPresent: true,
      studyHours: 1,
      batch: "batch1",
    },
    {
      key: "2",
      name: "John Doe",
      email: "john@example.com",
      avatar: "https://randomuser.me/api/portraits/men/45.jpg",
      isPresent: true,
      studyHours: 1,
      batch: "batch2",
    },
    {
      key: "3",
      name: "Anita Kumar",
      email: "anita@example.com",
      avatar: "https://randomuser.me/api/portraits/women/45.jpg",
      isPresent: true,
      studyHours: 1,
      batch: "batch1",
    },
  ]);

  const showModal = () => setIsModalOpen(true);
  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
    setCalculatedFee(0);
  };

  const handleFormChange = async () => {
    const values = form.getFieldsValue();
    if (values.month && values.year) {
      const response = await new Promise((resolve) =>
        setTimeout(() => resolve({ totalFee: 5000 }), 500)
      );
      setCalculatedFee(response.totalFee);
    }
  };

  const handleSubmit = (values) => {
    console.log("Submitted Fees Info:", values);
    setStudentFeeStatus(values.status);
    handleCancel();
  };

  const handleAttendanceChange = (key, type, value) => {
    setAttendanceData((prev) =>
      prev.map((student) =>
        student.key === key
          ? { ...student, [type]: value }
          : student
      )
    );
  };

  const filteredStudents = attendanceData.filter(
    (student) => student.batch === selectedBatch
  );

  const columns = [
    {
      title: "Student",
      dataIndex: "student",
      key: "student",
      render: (text, record) => (
        <div className="flex items-center gap-3">
          <Avatar src={record.avatar} />
          <div>
            <div className="font-medium">{record.name}</div>
            <div className="text-gray-500 text-sm">{record.email}</div>
          </div>
        </div>
      ),
    },
    {
      title: "Attendance",
      dataIndex: "attendance",
      key: "attendance",
      render: (status) => <Tag color="green">{status}</Tag>,
    },
    {
      title: "Fee Status",
      dataIndex: "fee",
      key: "fee",
      render: () => {
        let color =
          studentFeeStatus === "Paid"
            ? "green"
            : studentFeeStatus === "Unpaid"
            ? "red"
            : "orange";
        return <Tag color={color}>{studentFeeStatus}</Tag>;
      },
    },
    {
      title: "Actions",
      key: "actions",
      render: () => (
        <div className="flex gap-3">
          <UserOutlined className="text-blue-600 cursor-pointer text-lg" />
          <DollarOutlined
            className="text-green-600 cursor-pointer text-lg"
            onClick={showModal}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="w-full h-screen overflow-x-hidden bg-gray-50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-4 rounded shadow-sm mb-6">
        <h1 className="text-lg font-semibold">Mathify</h1>
        <div className="flex items-center gap-4">
          <span>Admin Name</span>
          <Avatar src="https://randomuser.me/api/portraits/women/44.jpg" />
          <LogoutOutlined className="text-lg cursor-pointer" />
        </div>
      </div>

      {/* Batch Select & Attendance Button */}
      <div className="flex items-center gap-4 mb-4 text-left">
        <Select
          placeholder="Select Batch"
          style={{ width: 200 }}
          onChange={(value) => setSelectedBatch(value)}
        >
          <Option value="batch1">Batch 1</Option>
          <Option value="batch2">Batch 2</Option>
        </Select>
        <Button
          type="primary"
          onClick={() => setAttendanceModalOpen(true)}
          disabled={!selectedBatch}
        >
          Mark Attendance
        </Button>
      </div>

      {/* Student Table */}
      <Card className="overflow-auto">
        <Table columns={columns} dataSource={attendanceData} pagination={false} />
      </Card>

      {/* Fee Modal */}
      <Modal
        title="Fee Payment Details"
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          onValuesChange={handleFormChange}
        >
          <Form.Item name="month" label="Month" rules={[{ required: true }]}>
            <Select placeholder="Select Month">
              {[
                "January",
                "February",
                "March",
                "April",
                "May",
                "June",
                "July",
                "August",
                "September",
                "October",
                "November",
                "December",
              ].map((month) => (
                <Option key={month} value={month}>
                  {month}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="year" label="Year" rules={[{ required: true }]}>
            <Select placeholder="Select Year">
              {[2023, 2024, 2025].map((year) => (
                <Option key={year} value={year}>
                  {year}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="mode"
            label="Mode of Payment"
            rules={[{ required: true }]}
          >
            <Select placeholder="Select Mode">
              <Option value="Cash">Cash</Option>
              <Option value="Online">Online</Option>
              <Option value="Bank Transfer">Bank Transfer</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="status"
            label="Fee Status"
            rules={[{ required: true }]}
          >
            <Select placeholder="Select Status">
              <Option value="Paid">Paid</Option>
              <Option value="Unpaid">Unpaid</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Calculated Fee">
            <InputNumber disabled value={calculatedFee} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Submit
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Attendance Modal */}
      <Modal
        title="Mark Attendance"
        open={attendanceModalOpen}
        onCancel={() => setAttendanceModalOpen(false)}
        footer={null}
      >
        <div className="text-base font-medium mb-2">
          Selected Batch: <span className="text-blue-600">{selectedBatch}</span>
        </div>

        <div className="mb-4">
          <DatePicker
            value={selectedDate}
            onChange={(date) => setSelectedDate(date)}
            style={{ width: "100%" }}
          />
        </div>

        {filteredStudents.map((student) => (
          <div
            key={student.key}
            className="flex items-center justify-between border-b py-3"
          >
            <div className="flex items-center gap-3">
              <Avatar src={student.avatar} />
              <div>
                <div className="font-medium">{student.name}</div>
                <div className="text-sm text-gray-500">{student.email}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <InputNumber
                min={1}
                value={student.studyHours}
                onChange={(value) =>
                  handleAttendanceChange(student.key, "studyHours", value)
                }
              />

              <Tooltip title="Present">
                <CheckCircleTwoTone
                  twoToneColor={student.isPresent ? "#52c41a" : "#d9d9d9"}
                  className="text-xl cursor-pointer"
                  onClick={() =>
                    handleAttendanceChange(student.key, "isPresent", true)
                  }
                />
              </Tooltip>

              <Tooltip title="Absent">
                <CloseCircleTwoTone
                  twoToneColor={!student.isPresent ? "#f5222d" : "#d9d9d9"}
                  className="text-xl cursor-pointer"
                  onClick={() =>
                    handleAttendanceChange(student.key, "isPresent", false)
                  }
                />
              </Tooltip>
            </div>
          </div>
        ))}

        <Button type="primary" className="mt-4 w-full">
          Submit Attendance
        </Button>
      </Modal>
    </div>
  );
}
