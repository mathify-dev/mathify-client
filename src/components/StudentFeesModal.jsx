import React, { useEffect, useState } from "react";
import { Modal, Spin, Empty, Tag, Button, Tooltip, message, Select, DatePicker } from "antd";
import { DownloadOutlined, CheckCircleOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import makeRequest from "../apiClient";

const StudentFeesModal = ({ open, onClose, studentId }) => {
  const [feeRecords, setFeeRecords] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Payment Modal State
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedMonthForPayment, setSelectedMonthForPayment] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentDate, setPaymentDate] = useState(dayjs());
  const [submittingPayment, setSubmittingPayment] = useState(false);

  const fetchFeeRecords = async () => {
    if (!studentId) return;
    setLoading(true);
    try {
      const response = await makeRequest(
        "get",
        `/api/fees/getStudentFees/${studentId}`
      );
      setFeeRecords(response || null);
    } catch (error) {
      console.error("Failed to fetch fee records:", error);
      message.error("Failed to fetch fee records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && studentId) {
      fetchFeeRecords();
    }
  }, [open, studentId]);

  const handleOpenPaymentModal = (month) => {
    setSelectedMonthForPayment(month);
    setPaymentMethod("cash");
    setPaymentDate(dayjs());
    setPaymentModalVisible(true);
  };

  const handleMarkAsPaid = async () => {
    if (!selectedMonthForPayment) return;
    setSubmittingPayment(true);
    try {
      await makeRequest("post", "/api/fees/createNewFees", {
        studentId,
        billingMonth: selectedMonthForPayment,
        paymentMethod,
        paidOn: paymentDate.toISOString(),
      });
      message.success("Fee marked as paid successfully");
      setPaymentModalVisible(false);
      fetchFeeRecords(); // Refresh list
    } catch (error) {
      console.error("Failed to mark fees as paid:", error);
      message.error(error.response?.data?.error || "Failed to mark fees as paid");
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleDownloadInvoice = async (month) => {
    try {
      const response = await makeRequest(
        "get",
        `/api/fees/generateInvoice/${studentId}`,
        null,
        { month },
        { responseType: 'blob' }
      );
      
      // Create a blob link to download
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      const fileName = `invoice-${studentId}-${month}.pdf`;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Failed to download invoice:", error);
      message.error("Failed to download invoice");
    }
  };

  return (
    <>
      <Modal
        open={open}
        title="Fee Records"
        onCancel={onClose}
        footer={null}
        width={800}
      >
        {loading ? (
          <div className="flex justify-center my-6">
            <Spin />
          </div>
        ) : !feeRecords?.feesSummary || feeRecords?.feesSummary.length === 0 ? (
          <Empty description="No fee records found." />
        ) : (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto p-1">
            {feeRecords?.feesSummary?.map((details) => (
              <div
                key={details?.billingMonth}
                className="bg-white p-3 rounded shadow-sm border border-gray-200 grid grid-cols-12 gap-4 items-center"
              >
                <div className="col-span-3 font-medium">
                  {details?.billingMonth
                    ? dayjs(details.billingMonth, "YYYY-MM").format("MMMM YYYY")
                    : "-"}
                </div>
                <div className="col-span-2 text-sm text-gray-500">
                  Hours: {details?.totalHours || 0}
                </div>
                <div className="col-span-2 text-sm text-gray-500">
                  ₹{details?.payableAmount || 0}
                </div>
                <div className="col-span-3 flex flex-col items-start">
                  <Tag color={details?.isSettled ? "green" : "orange"}>
                    {details?.isSettled ? "Paid" : "Pending"}
                  </Tag>
                  {details?.isSettled && details?.paidOn && (
                    <span className="text-xs text-gray-400 mt-1">
                      {dayjs(details.paidOn).format("DD MMM YYYY")} via {details?.paymentMethod || "-"}
                    </span>
                  )}
                </div>
                <div className="col-span-2 flex justify-end gap-2">
                  {!details?.isSettled && (
                    <Tooltip title="Mark as Paid">
                      <Button 
                        type="text" 
                        icon={<CheckCircleOutlined className="text-green-600" />} 
                        onClick={() => handleOpenPaymentModal(details.billingMonth)}
                      />
                    </Tooltip>
                  )}
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
      </Modal>

      <Modal
        open={paymentModalVisible}
        title="Mark Fees as Paid"
        onCancel={() => setPaymentModalVisible(false)}
        onOk={handleMarkAsPaid}
        confirmLoading={submittingPayment}
      >
        <div className="space-y-4 py-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
            <Select
              value={paymentMethod}
              onChange={setPaymentMethod}
              style={{ width: '100%' }}
              options={[
                { value: 'cash', label: 'Cash' },
                { value: 'UPI', label: 'UPI' },
              ]}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
            <DatePicker 
              value={paymentDate} 
              onChange={setPaymentDate} 
              style={{ width: '100%' }} 
              allowClear={false}
            />
          </div>
        </div>
      </Modal>
    </>
  );
};

export default StudentFeesModal;
