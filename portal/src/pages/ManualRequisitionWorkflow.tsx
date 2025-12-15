import React, { useMemo, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "antd";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import {
  CheckCircleOutlined,
  FileTextOutlined,
  EnvironmentOutlined,
  SearchOutlined,
  SendOutlined,
  ExperimentOutlined,
} from "@ant-design/icons";
import CustomSteps from "../components/CustomSteps";
import PersonInfo from "../components/PersonInfo";
import ManualRequisitionEditor from "../components/ManualRequisitionEditor";
import LocationSelector from "../components/LocationSelector";
import OrderReview from "../components/OrderReview";
import FaxSender from "../components/FaxSender";
import {
  useCurrentDiagnosisInfoStore,
  useSelectedLabStore,
  useOrderSubmittedStore,
  useRequisitionWorkflowStore,
} from "../store";

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

const ManualRequisitionWorkflow: React.FC = () => {
  const query = useQuery();
  const navigate = useNavigate();
  const patientIdFromQuery = query.get("patient_id");
  const patientId = patientIdFromQuery ? Number(patientIdFromQuery) : undefined;

  const { diagnosisInfo } = useCurrentDiagnosisInfoStore();
  const { selectedLab } = useSelectedLabStore();
  const { isOrderSubmitted, setOrderSubmitted } = useOrderSubmittedStore();
  const { requisitionId, hasGeneratedRequisition } = useRequisitionWorkflowStore();

  useEffect(() => { window.scrollTo(0, 0); setOrderSubmitted(false); }, [setOrderSubmitted]);

  const steps = [
    { title: "Diagnosis Info", description: "View and confirm patient's latest diagnosis", icon: <CheckCircleOutlined /> },
    { title: "Manual Entry + AI Assist", description: "Create empty requisition, edit fields, or let AI complete", icon: <FileTextOutlined /> },
    { title: "Facility Selection", description: "Choose preferred lab", icon: <EnvironmentOutlined /> },
    { title: "Professional Review", description: "Clinical staff review and refine before approval.", icon: <SearchOutlined /> },
    { title: "Fax Confirmation", description: "Finalize and send requisition", icon: <SendOutlined /> },
  ];

  const [current, setCurrent] = useState(0);
  const canProceedFromStep1 = current === 0 ? Boolean(diagnosisInfo && diagnosisInfo.length > 0) : true;
  const canProceedFromStep2 = current === 1 ? Boolean(hasGeneratedRequisition && requisitionId) : true;
  const canProceedFromStep3 = current === 2 ? Boolean(selectedLab) : true;
  const canProceedFromStep4 = current === 3 ? isOrderSubmitted : true;
  const canProceed = canProceedFromStep1 && canProceedFromStep2 && canProceedFromStep3 && canProceedFromStep4;

  const next = () => { setCurrent((c) => c + 1); setTimeout(() => window.scrollTo({ top: 200, behavior: "smooth" }), 50); };
  const prev = () => { setCurrent((c) => c - 1); setTimeout(() => window.scrollTo({ top: 200, behavior: "smooth" }), 50); };

  return (
    <div className="min-h-screen w-full p-8 relative bg-slate-50">
      <div className="max-w-7xl mx-auto mb-12 text-center relative z-10">
        <div className="inline-flex items-center justify-center p-3 bg-white rounded-2xl shadow-md mb-6 ring-1 ring-slate-100">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-200/50">
            <ExperimentOutlined className="text-white text-2xl" />
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-3 tracking-tight">Manual Requisition + AI Assist</h1>
        <p className="text-slate-500 text-lg max-w-2xl mx-auto font-medium">Create, edit, AI-complete, review and fax a requisition</p>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-12 gap-6 relative z-10 items-stretch">
        <div className="col-span-3">
          <div className="sticky top-4 glass-card p-6 flex flex-col">
            <div className="mb-6 flex-shrink-0">
              <h3 className="text-xl font-bold text-gray-800 mb-1">Progress Tracker</h3>
              <p className="text-sm text-gray-500">Step {current + 1} of {steps.length}</p>
            </div>
            <div className="flex-1 flex items-stretch">
              <CustomSteps steps={steps} current={current} />
            </div>
          </div>
        </div>
        <div className="col-span-9">
          <div className="glass-card p-8 flex flex-col h-full">
            <div className="mb-0 flex items-center justify-between">
              <div className="flex items-baseline">
                <h2 className="text-3xl font-bold gradient-text">{steps[current].title}</h2>
                <p className="text-gray-600 text-base ml-4">{steps[current].description}</p>
              </div>
            </div>
            <div className="flex-1 relative">
              <TransitionGroup component={null}>
                <CSSTransition key={current} timeout={500} classNames="page">
                  <div className="w-full">
                    {current === 0 && <PersonInfo />}
                    {current === 1 && (
                      <ManualRequisitionEditor
                        patientId={Number(diagnosisInfo?.[0]?.patient_id ?? patientId)}
                      />
                    )}
                    {current === 2 && <LocationSelector mode="requisition-only" />}
                    {current === 3 && <OrderReview mode="requisition-only" />}
                    {current === 4 && <FaxSender mode="requisition-only" />}
                  </div>
                </CSSTransition>
              </TransitionGroup>
            </div>
            <div className="flex justify-end items-center mt-6 pt-6 border-t-2 border-gray-200">
              {current === 3 && !isOrderSubmitted && (
                <div className="flex-1 mr-4">
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
                    <p className="text-sm text-yellow-800 font-medium">⚠️ Please click "Submit Orders" to submit your requisition before proceeding to the next step.</p>
                  </div>
                </div>
              )}
              <div className="flex gap-3">
                {false && current > 0 && current !== 2 && (
                  <Button onClick={prev} size="large" className="premium-button">Previous</Button>
                )}
                {current < steps.length - 1 && (
                  <Button type="primary" onClick={next} size="large" className="premium-button" disabled={!canProceed}
                    style={{ background: "linear-gradient(135deg, #06b6d4 0%, #14b8a6 100%)", border: "none" }}>
                    Next Step
                  </Button>
                )}
                {current === steps.length - 1 && (
                  <Button type="primary" size="large" className="premium-button" icon={<SendOutlined />} onClick={() => navigate("/")}>Done!</Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManualRequisitionWorkflow;
