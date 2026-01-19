import React from "react";
import { Modal, Table } from "antd";

const StudentDetailsModal = ({ open, onClose, student }) => {
  return (
    <Modal
      open={open}
      title="Student Details"
      onCancel={onClose}
      footer={null}
      width={700}
    >
      <div className="p-6">
        {/* Student Details */}
        <div className="flex flex-wrap gap-x-12 gap-y-4 text-sm text-gray-700">
          <div>
            <p className="font-semibold text-gray-500">Name</p>
            <p>{student?.name || "-"}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-500">Email</p>
            <p>{student?.email || "-"}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-500">Phone</p>
            <p>{student?.phone || "-"}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-500">Parents Name</p>
            <p>{student?.parentsName || "-"}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-500">Date of Birth</p>
            <p>{student?.dateOfBirth || "-"}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-500">Gender</p>
            <p>{student?.gender || "-"}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-500">Mode of Learning</p>
            <p>{student?.preferredModeOfLearning || "-"}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-500">
              Objective of Enrolling
            </p>
            <p>{student?.objectiveOfEnrolling || "-"}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-500">
              Examinations Targetting
            </p>
            <p>{student?.examinationsTargetting || "-"}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-500">
              Desired Number of Hours
            </p>
            <p>{student?.desiredNumberOfHours || "-"}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-500">Fees Per Hour</p>
            <p>₹{student?.feesPerHour || 0}</p>
          </div>
        </div>
        {student?.schedule && (
          <div className="mt-6">
            <p className="font-semibold text-gray-500 mb-2">Schedule</p>
            <Table
              dataSource={Object.entries(student?.schedule || {}).map(
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
  );
};

export default StudentDetailsModal;
