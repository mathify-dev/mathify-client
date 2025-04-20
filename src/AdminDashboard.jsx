import React, { useEffect, useState } from "react";
import {
  Table,
  Tag,
  Select,
  Card,
  Avatar,
  Modal,
  Form,
  Input,
  InputNumber,
  Button,
  Tooltip,
  DatePicker,
  Checkbox,
  Empty,
  Spin,
  message,
  Tabs,
} from "antd";
import {
  UserOutlined,
  LogoutOutlined,
  DollarOutlined,
  CheckCircleTwoTone,
  CloseCircleTwoTone,
  PlusOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import makeRequest from "./apiClient";

const { TabPane } = Tabs;

const { Option } = Select;

const BASE_URL = import.meta.env.VITE_BASE_URL || "http://localhost:5173";

export default function AdminDashboard({ user }) {
  const [isFeeModalOpen, setIsFeeModalOpen] = useState(false);
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [newBatchModalOpen, setNewBatchModalOpen] = useState(false);
  const [newStudentModalOpen, setNewStudentModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [batchForm] = Form.useForm();
  const [studentForm] = Form.useForm();
  const [attendanceForm] = Form.useForm();

  const [feeDetailsLoading, setFeeDetailsLoading] = useState(false);

  const [calculatedFee, setCalculatedFee] = useState(0);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [selectedDate, setSelectedDate] = useState(dayjs());

  const [batches, setBatches] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [studentLoading, setStudentLoading] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [feeDetails, setFeeDetails] = useState(null);

  const [selectedMonth, setSelectedMonth] = useState(dayjs());
  const [studentDetails, setStudentDetails] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [feeRecords, setFeeRecords] = useState([]);
  const [studentMonthLoading, setStudentMonthLoading] = useState(false);
  const [feeLoading, setFeeLoading] = useState(false);
  const [isUserDetailsModalOpen, setIsUserDetailsModalOpen] = useState(false);

  const fetchStudentMonthData = async (studentId, month) => {
    setStudentMonthLoading(true);
    try {
      const monthYear = month.format("YYYY-MM");
      const response = await makeRequest(
        "get",
        `/api/students/studentMonthDetails/${studentId}/${monthYear}`
      );
      setStudentDetails(response.student);
      setAttendance(response.attendance);
    } catch (error) {
      console.error("Failed to fetch student data:", error);
    } finally {
      setStudentMonthLoading(false);
    }
  };

  const fetchFeeRecords = async (studentId) => {
    setFeeLoading(true);
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
    fetchBatches();
  }, []);

  useEffect(() => {
    if (selectedMonth && isUserDetailsModalOpen) {
      fetchStudentMonthData(selectedStudentId, selectedMonth);
    }
  }, [selectedMonth, isUserDetailsModalOpen]);

  useEffect(() => {
    if (isUserDetailsModalOpen) {
      fetchFeeRecords(selectedStudentId);
    }
  }, [isUserDetailsModalOpen]);

  const fetchFeeDetails = async (studentId, monthYear) => {
    try {
      setFeeDetailsLoading(true);
      const response = await makeRequest(
        "get",
        `api/fees/feeDetails/${studentId}/${monthYear}`
      );
      setFeeDetails(response);
      setCalculatedFee(response.totalFeeExpected);
    } catch (error) {
      console.error("Error fetching fee details:", error);
    } finally {
      setFeeDetailsLoading(false);
    }
  };

  const fetchBatches = async () => {
    setLoading(true);

    const response = await makeRequest("GET", "/api/batches/getAllBatches");
    setBatches(response);
    setLoading(false);
  };

  const openFeeModal = async (studentId) => {
    const lastMonth = dayjs().subtract(1, "month").startOf("month");
    form.setFieldsValue({ billingMonth: lastMonth });
    setIsFeeModalOpen(true);
    setSelectedStudentId(studentId);
    await fetchFeeDetails(studentId, lastMonth.format("YYYY-MM"));
  };

  const fetchStudents = async (batchId) => {
    try {
      setStudentLoading(true);
      const response = await makeRequest(
        "get",
        `/api/students/allSummary/${batchId}`
      );

      const initializedAttendanceData = response.map((student) => ({
        ...student,
        studyHours: 1, // Default study hours
        isPresent: true, // Default presence
      }));

      setAttendanceData(initializedAttendanceData);
      setStudentLoading(false);
    } catch (error) {
      console.log("error", error);
      setAttendanceData([]);
      setStudentLoading(false);
    }
  };

  const handleBatchChange = (value) => {
    setSelectedBatch(value);
    fetchStudents(value);
  };

  const handleFeeSubmit = (values) => {
    try {
      const payload = {
        student: selectedStudentId,
        billingMonth: values.billingMonth.format("YYYY-MM"),
        isSettled: values.isSettled,
        paymentMethod: values.paymentMethod,
      };
      const response = makeRequest("post", "/api/fees/createNewFees", payload);
      fetchStudents(selectedBatch);
      setIsFeeModalOpen(false);
      form.resetFields();
    } catch (error) {
      console.log("error", error);
    }
  };

  const handleAttendanceChange = (studentId, field, value) => {
    setAttendanceData((prev) =>
      prev.map((student) =>
        student.student._id === studentId
          ? { ...student, [field]: value }
          : student
      )
    );
  };

  const handleAttendanceSubmit = async () => {
    try {
      const attendancePayload = attendanceData.map((student) => ({
        student: student?.student?._id,
        isPresent: student?.isPresent,
        hours: student?.studyHours,
        date: selectedDate.format("YYYY-MM-DD"),
      }));
      const response = await makeRequest(
        "post",
        "/api/attendance/addAttendance",
        attendancePayload
      );
      fetchStudents(selectedBatch);
    } catch (error) {
      console.log("error", error);
    } finally {
      setAttendanceModalOpen(false);
    }
  };

  const handleNewBatchSubmit = async (values) => {
    try {
      const payload = {
        name: values.name,
        feesPerHour: values.feesPerHour,
      };
      const response = await makeRequest(
        "post",
        "/api/batches/createNewBatch",
        payload
      );
      setNewBatchModalOpen(false);
      batchForm.resetFields();
      fetchBatches();
    } catch (error) {
      console.log("error", error);
    }
  };

  const handleNewStudentSubmit = async (values) => {
    try {
      const payload = {
        ...values,
        isAdmin: values.isAdmin ? values.isAdmin : false,
        batch: selectedBatch,
      };
      const response = await makeRequest(
        "post",
        "api/students/createNewStudent",
        payload
      );
      fetchStudents(selectedBatch);
    } catch (error) {
      console.log("error", error);
    } finally {
      setNewStudentModalOpen(false);
      studentForm.resetFields();
    }
  };

  const columns = [
    {
      title: "Student",
      dataIndex: "student",
      key: "student",
      render: (text, record) => (
        <div className="flex items-center gap-3">
          {/* <Avatar src={record.avatar} /> */}
          <div>
            <div className="font-medium text-base">{record?.student?.name}</div>
            <div className="text-gray-500 text-sx">
              {record?.student?.email}
            </div>
            {/* <div className="text-gray-500 text-sx">{record?.student?.phone}</div> */}
          </div>
        </div>
      ),
    },
    {
      title: "Attendance",
      dataIndex: "attendance",
      key: "attendance",
      render: (text, record) => <div>{record?.totalClassesThisMonth}</div>,
    },
    {
      title: "Fee Status",
      dataIndex: "fee",
      key: "fee",
      render: (text, record) => {
        let color =
          record.feesPaidForPreviousMonth === true ? "green" : "orange";
        return (
          <Tag color={color}>
            {record?.feesPaidForPreviousMonth ? "Paid" : "Pending"}
          </Tag>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      render: (text, record) => (
        <div className="flex gap-3">
          <UserOutlined
            className="text-blue-600 cursor-pointer text-lg"
            onClick={() => {
              setSelectedStudentId(record?.student?._id);
              setIsUserDetailsModalOpen(true);
            }}
          />
          <DollarOutlined
            className="text-green-600 cursor-pointer text-lg"
            onClick={() => openFeeModal(record.student._id)}
          />
        </div>
      ),
    },
  ];

  useEffect(() => {
    if (feeDetails) {
      form.setFieldsValue({
        billingMonth: feeDetails.billingMonth
          ? dayjs(feeDetails.billingMonth)
          : null,
        paymentMethod: feeDetails.paymentMethod || undefined,
        isSettled: feeDetails.feesPaid,
      });
    }
  }, [feeDetails]);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = `${BASE_URL}`;
  };

  return (
    <div className="w-full min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-4 rounded shadow-sm mb-6">
        <h1 className="text-lg font-semibold">Mathify</h1>
        <div className="flex items-center gap-4">
          <span>{user?.name}</span>
          <Avatar src={`${user?.avatar}`} />
          <LogoutOutlined
            className="text-lg cursor-pointer"
            onClick={handleLogout}
          />
        </div>
      </div>

      {/* Batch Selection */}
      <div className="flex items-center gap-4 mb-4">
        <Select
          placeholder="Select Batch"
          style={{ width: 200 }}
          onChange={handleBatchChange}
          loading={loading}
        >
          {batches.map((batch) => (
            <Option key={batch._id} value={batch._id}>
              {batch.name}
            </Option>
          ))}
        </Select>
        <Button
          icon={<PlusOutlined />}
          onClick={() => setNewBatchModalOpen(true)}
        >
          New Batch
        </Button>
      </div>

      {/* Student Table */}
      <Card>
        {selectedBatch ? (
          studentLoading ? (
            <div className="text-center">
              <Spin />
            </div>
          ) : attendanceData.length ? (
            <>
              <div className="flex justify-end mb-4 gap-2">
                <Button onClick={() => setAttendanceModalOpen(true)}>
                  Mark Attendance
                </Button>
                <Button
                  icon={<PlusOutlined />}
                  onClick={() => setNewStudentModalOpen(true)}
                >
                  New Student
                </Button>
              </div>
              <Table
                columns={columns}
                dataSource={attendanceData}
                pagination={false}
              />
            </>
          ) : (
            <>
              <div className="flex justify-end mb-4 gap-2">
                <Button
                  icon={<PlusOutlined />}
                  onClick={() => setNewStudentModalOpen(true)}
                >
                  New Student
                </Button>
              </div>
              <Empty
                image={<TeamOutlined style={{ fontSize: 48 }} />}
                description={<span>No students for the selected batch.</span>}
              />
            </>
          )
        ) : (
          <Empty
            image={<TeamOutlined style={{ fontSize: 48 }} />}
            description={<span>Please select a batch to continue.</span>}
          />
        )}
      </Card>

      {/* Fee Modal */}
      <Modal
        title="Fee Payment Details"
        open={isFeeModalOpen}
        onCancel={() => setIsFeeModalOpen(false)}
        style={{ top: 20 }}
        footer={null}
      >
        {feeDetailsLoading ? (
          <div className="flex justify-center items-center py-10">
            <Spin />
          </div>
        ) : feeDetails ? (
          <>
            <div className="mb-6 p-4 bg-gray-100 rounded-md border border-gray-200 shadow-sm text-sm space-y-1">
              <div className="flex justify-between">
                <span className="font-medium">Student Name:</span>
                <span>{feeDetails.studentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Total Classes:</span>
                <span>{feeDetails.totalClasses}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Total Hours Attended:</span>
                <span>{feeDetails.totalHoursAttended}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Total Fee Expected:</span>
                <span>₹{feeDetails.totalFeeExpected}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Fee Status:</span>
                <Tag color={feeDetails.feesPaid ? "green" : "orange"}>
                  {feeDetails.feesPaid ? "Paid" : "Pending"}
                </Tag>
              </div>
            </div>

            <Form
              form={form}
              layout="vertical"
              onFinish={handleFeeSubmit}
              initialValues={{
                billingMonth: feeDetails.billingMonth
                  ? dayjs(feeDetails.billingMonth)
                  : null,
                paymentMethod: feeDetails.paymentMethod || undefined,
                isSettled: feeDetails.feesPaid,
              }}
              onValuesChange={(changed) => {
                if (changed.billingMonth && selectedStudentId) {
                  const monthYear = changed.billingMonth.format("YYYY-MM");
                  fetchFeeDetails(selectedStudentId, monthYear);
                }
              }}
            >
              <Form.Item
                name="billingMonth"
                label="Billing Month"
                rules={[
                  {
                    required: true,
                    message: "Please select the billing month!",
                  },
                ]}
              >
                <DatePicker
                  picker="month"
                  format="YYYY-MM"
                  style={{ width: "100%" }}
                />
              </Form.Item>

              <Form.Item
                name="paymentMethod"
                label="Payment Method"
                rules={[
                  {
                    required: true,
                    message: "Please select the payment method!",
                  },
                ]}
              >
                <Select
                  placeholder="Select Payment Method"
                  disabled={feeDetails.feesPaid}
                >
                  <Option value="cash">Cash</Option>
                  <Option value="UPI">UPI</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="isSettled"
                label="Fee Status"
                rules={[
                  { required: true, message: "Please select the fee status!" },
                ]}
              >
                <Select
                  placeholder="Select Fee Status"
                  disabled={feeDetails.feesPaid}
                >
                  <Option value={true}>Paid</Option>
                  <Option value={false}>Unpaid</Option>
                </Select>
              </Form.Item>

              <Form.Item label="Calculated Fee">
                <InputNumber
                  disabled
                  value={feeDetails.totalFeeExpected}
                  style={{ width: "100%" }}
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  disabled={feeDetails.feesPaid}
                >
                  Submit
                </Button>
              </Form.Item>
            </Form>
          </>
        ) : null}
      </Modal>

      {/* Attendance Modal */}
      <Modal
        title="Mark Attendance"
        open={attendanceModalOpen}
        onCancel={() => setAttendanceModalOpen(false)}
        footer={null}
      >
        <div className="text-base font-medium mb-2">
          Batch:{" "}
          <span className="text-blue-600">
            {batches.find((batch) => batch._id === selectedBatch)?.name}
          </span>
        </div>
        <DatePicker
          value={selectedDate}
          onChange={(date) => setSelectedDate(date)}
          style={{ width: "100%" }}
        />
        {attendanceData.map((student) => (
          <div
            key={student?.student?._id}
            className="flex items-center justify-between border-b py-3"
          >
            <div className="flex items-center gap-3">
              {/* <Avatar src={student.avatar} /> */}
              <div>
                <div className="font-medium">{student?.student?.name}</div>
                <div className="text-sm text-gray-500">
                  {student?.student?.email}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <InputNumber
                min={1}
                value={student.studyHours}
                onChange={(value) =>
                  handleAttendanceChange(
                    student?.student?._id,
                    "studyHours",
                    value
                  )
                }
              />
              <Tooltip title="Present">
                <CheckCircleTwoTone
                  twoToneColor={student.isPresent ? "#52c41a" : "#d9d9d9"}
                  className="text-xl cursor-pointer"
                  onClick={() =>
                    handleAttendanceChange(
                      student?.student?._id,
                      "isPresent",
                      true
                    )
                  }
                />
              </Tooltip>
              <Tooltip title="Absent">
                <CloseCircleTwoTone
                  twoToneColor={!student.isPresent ? "#f5222d" : "#d9d9d9"}
                  className="text-xl cursor-pointer"
                  onClick={() =>
                    handleAttendanceChange(
                      student?.student?._id,
                      "isPresent",
                      false
                    )
                  }
                />
              </Tooltip>
            </div>
          </div>
        ))}
        <Button
          type="primary"
          className="mt-4 w-full"
          onClick={handleAttendanceSubmit}
        >
          Submit Attendance
        </Button>
      </Modal>

      {/* New Batch Modal */}
      <Modal
        title="Create a New Batch"
        open={newBatchModalOpen}
        onCancel={() => setNewBatchModalOpen(false)}
        footer={null}
      >
        <Form
          form={batchForm}
          layout="vertical"
          onFinish={handleNewBatchSubmit}
        >
          <Form.Item
            name="name"
            label="Batch Name"
            rules={[{ required: true, message: "Please enter batch name" }]}
          >
            <Input placeholder="Enter batch name" />
          </Form.Item>
          <Form.Item
            name="feesPerHour"
            label="Fees Per Hour"
            rules={[{ required: true, message: "Please enter fee amount" }]}
          >
            <InputNumber
              placeholder="Enter fee"
              style={{ width: "100%" }}
              min={1}
            />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>
            Save
          </Button>
        </Form>
      </Modal>

      {/* New Student Modal */}
      <Modal
        title="Add a New Student"
        open={newStudentModalOpen}
        onCancel={() => setNewStudentModalOpen(false)}
        footer={null}
      >
        <div className="text-base font-medium mb-2">
          Batch:{" "}
          <span className="text-blue-600">
            {batches.find((batch) => batch._id === selectedBatch)?.name}
          </span>
        </div>
        <Form
          form={studentForm}
          layout="vertical"
          onFinish={handleNewStudentSubmit}
        >
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: "Please enter student name" }]}
          >
            <Input placeholder="Enter student name" />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, message: "Please enter email" }]}
          >
            <Input placeholder="Enter email" />
          </Form.Item>
          <Form.Item
            name="phone"
            label="Phone"
            rules={[{ required: true, message: "Please enter phone number" }]}
          >
            <Input placeholder="Enter phone number" />
          </Form.Item>
          <Form.Item name="isAdmin" valuePropName="checked">
            <Checkbox>Is Admin?</Checkbox>
          </Form.Item>
          <Button type="primary" htmlType="submit" block>
            Save Student
          </Button>
        </Form>
      </Modal>

      <Modal
        title="Student Details"
        open={isUserDetailsModalOpen}
        onCancel={() => setIsUserDetailsModalOpen(false)}
        footer={null}
        width={800}
      >
        <div className="w-full min-h-screen bg-gray-50 p-6">
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
      </Modal>
    </div>
  );
}
