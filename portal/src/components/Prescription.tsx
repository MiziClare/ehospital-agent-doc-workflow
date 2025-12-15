import React from "react";
import { Card, Badge, Table, Descriptions, Tag } from "antd";
import {
  MedicineBoxOutlined,
  UserOutlined,
  SafetyOutlined,
  FileTextOutlined,
  ExperimentOutlined,
} from "@ant-design/icons";
import { Chip, Avatar } from "@mui/material";
import LocalPharmacyIcon from "@mui/icons-material/LocalPharmacy";

const Prescription: React.FC = () => {
  const medicationColumns = [
    {
      title: "Medication",
      dataIndex: "name",
      key: "name",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render: (text: string, record: any) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center">
            <LocalPharmacyIcon sx={{ color: "white", fontSize: 20 }} />
          </div>
          <div>
            <p className="font-bold text-gray-800 m-0">{text}</p>
            <p className="text-xs text-gray-500 m-0">{record.type}</p>
          </div>
        </div>
      ),
    },
    {
      title: "Dosage",
      dataIndex: "dosage",
      key: "dosage",
      align: "center" as const,
      render: (text: string) => (
        <span className="font-semibold text-cyan-700">{text}</span>
      ),
    },
    {
      title: "Frequency",
      dataIndex: "frequency",
      key: "frequency",
      align: "center" as const,
      render: (text: string) => (
        <Chip
          label={text}
          size="small"
          sx={{
            backgroundColor: "#e0f2fe",
            color: "#0891b2",
            fontWeight: "bold",
          }}
        />
      ),
    },
    {
      title: "Duration",
      dataIndex: "duration",
      key: "duration",
      align: "center" as const,
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
      align: "center" as const,
      render: (text: string) => (
        <span className="font-bold text-gray-800">{text}</span>
      ),
    },
    {
      title: "Instructions",
      dataIndex: "instructions",
      key: "instructions",
      render: (text: string) => (
        <p className="text-xs text-gray-600 m-0 max-w-xs">{text}</p>
      ),
    },
  ];

  const medicationData = [
    {
      key: "1",
      name: "Amoxicillin 500mg",
      type: "Antibiotic - Capsules",
      dosage: "1 tablet",
      frequency: "3x daily",
      duration: "30 days",
      quantity: "90 tablets",
      instructions: "Take with food. Complete full course.",
    },
    {
      key: "2",
      name: "Ibuprofen 400mg",
      type: "Pain Reliever - Tablets",
      dosage: "1 tablet",
      frequency: "Every 6-8h",
      duration: "As needed",
      quantity: "30 tablets",
      instructions: "Take with food or milk. Max 3/day.",
    },
  ];

  return (
    <div className="w-full h-full space-y-4">
      {/* Patient Card */}
      <Card
        title={
          <div className="flex items-center gap-2">
            <UserOutlined className="text-cyan-600" />
            <span>Patient Information</span>
          </div>
        }
        extra={<Tag color="green">Verified</Tag>}
        className="shadow-md"
      >
        <Descriptions column={2} size="small">
          <Descriptions.Item label="Full Name">John Smith</Descriptions.Item>
          <Descriptions.Item label="Date of Birth">
            January 15, 1985
          </Descriptions.Item>
          <Descriptions.Item label="Age">40 years</Descriptions.Item>
          <Descriptions.Item label="Gender">Male</Descriptions.Item>
          <Descriptions.Item label="Blood Type">
            <Chip
              label="A+"
              size="small"
              sx={{
                background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                color: "white",
                fontWeight: "bold",
              }}
            />
          </Descriptions.Item>
          <Descriptions.Item label="Insurance ID">
            INS-123456789
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Medications Table */}
      <Card
        title={
          <div className="flex items-center gap-2">
            <MedicineBoxOutlined className="text-purple-600" />
            <span>Prescribed Medications</span>
          </div>
        }
        extra={<Badge count={2} style={{ backgroundColor: "#a855f7" }} />}
        className="shadow-md"
      >
        <Table
          columns={medicationColumns}
          dataSource={medicationData}
          pagination={false}
          size="small"
        />
      </Card>

      {/* Requisition Card */}
      <Card
        title={
          <div className="flex items-center gap-2">
            <FileTextOutlined className="text-orange-600" />
            <span>Laboratory Requisition</span>
          </div>
        }
        extra={<Tag color="orange">Pending</Tag>}
        className="shadow-md"
      >
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-bold text-gray-700 mb-3">
              Requisition Details
            </h4>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Requisition ID">
                REQ-2025-001234
              </Descriptions.Item>
              <Descriptions.Item label="Type">
                Blood Work & Imaging
              </Descriptions.Item>
              <Descriptions.Item label="Priority">Routine</Descriptions.Item>
              <Descriptions.Item label="Issue Date">
                October 5, 2025
              </Descriptions.Item>
            </Descriptions>
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-700 mb-3">
              Service Center
            </h4>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Facility">
                City Medical Lab
              </Descriptions.Item>
              <Descriptions.Item label="Address">
                789 Lab Street, NY 10003
              </Descriptions.Item>
              <Descriptions.Item label="Phone">
                (555) 987-6543
              </Descriptions.Item>
              <Descriptions.Item label="Hours">
                Mon-Fri: 7:00 AM - 5:00 PM
              </Descriptions.Item>
            </Descriptions>
          </div>
        </div>
        <div className="mt-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
          <div className="flex items-start gap-3">
            <ExperimentOutlined className="text-orange-600 text-lg mt-1" />
            <div>
              <h4 className="text-sm font-bold text-gray-800 m-0 mb-2">
                Requested Tests
              </h4>
              <div className="flex flex-wrap gap-2">
                <Tag color="orange">Complete Blood Count (CBC)</Tag>
                <Tag color="orange">Lipid Panel</Tag>
                <Tag color="orange">Glucose Test</Tag>
                <Tag color="orange">Chest X-Ray</Tag>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Prescriber Card */}
      <Card
        title={
          <div className="flex items-center gap-2">
            <SafetyOutlined className="text-emerald-600" />
            <span>Prescriber Information</span>
          </div>
        }
        className="shadow-md"
      >
        <div className="flex items-start gap-6">
          <Avatar
            sx={{
              width: 80,
              height: 80,
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              fontSize: "32px",
              fontWeight: "bold",
              border: "4px solid #f0fdf4",
            }}
          >
            SJ
          </Avatar>
          <div className="flex-1">
            <h4 className="text-lg font-bold text-gray-800 m-0 mb-2">
              Dr. Sarah Johnson, MD
            </h4>
            <Descriptions column={2} size="small">
              <Descriptions.Item label="Specialty">
                Internal Medicine
              </Descriptions.Item>
              <Descriptions.Item label="License">MD-123456</Descriptions.Item>
              <Descriptions.Item label="NPI">1234567890</Descriptions.Item>
              <Descriptions.Item label="DEA">AB1234563</Descriptions.Item>
              <Descriptions.Item label="Phone">
                (555) 123-4567
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                dr.johnson@hospital.com
              </Descriptions.Item>
            </Descriptions>
            <div className="mt-4 p-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-200">
              <p className="text-xs text-gray-600 mb-2">Digital Signature</p>
              <p
                className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600 m-0"
                style={{ fontFamily: "cursive" }}
              >
                Sarah Johnson
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Signed on October 5, 2025
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Prescription;
