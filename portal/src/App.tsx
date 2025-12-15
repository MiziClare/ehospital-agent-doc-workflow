import "./App.css";
import "antd/dist/reset.css";
import { useState, useEffect } from "react";
import { Button, message, Card } from "antd";
import {
  RobotOutlined,
  CheckCircleOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  SendOutlined,
  CloseOutlined,
  MedicineBoxOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { Step1 } from "./pages/step1";
import { Step3 } from "./pages/step3";
import { Step4 } from "./pages/step4";
import { Step2 } from "./pages/step2";
import { Step5 } from "./pages/step5";
import { CompletionPage } from "./pages/completion";
import CustomSteps from "./components/CustomSteps";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import {
  useCurrentDiagnosisInfoStore,
  useGeneratedOrdersStore,
  useSelectedPharmacyStore,
  useSelectedLabStore,
  useOrderSubmittedStore,
  useWorkflowGenerationStore,
} from "./store";

const App = () => {
  const [showSidebar, setShowSidebar] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const { diagnosisInfo, updateDiagnosisInfo } = useCurrentDiagnosisInfoStore();
  const { prescriptionId, requisitionId, updateOrderIds } =
    useGeneratedOrdersStore();
  const { selectedPharmacy } = useSelectedPharmacyStore();
  const { selectedLab } = useSelectedLabStore();
  const { isOrderSubmitted } = useOrderSubmittedStore();
  const { hasGeneratedOrders } = useWorkflowGenerationStore();

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const steps = [
    {
      title: "Diagnosis Info",
      description: "View and confirm patient's latest diagnosis",
      icon: <CheckCircleOutlined />,
    },
    {
      title: "Agent Doc Generation",
      description: "AI generates prescription & requisition forms",
      icon: <FileTextOutlined />,
    },
    {
      title: "Facility Selection",
      description: "Choose preferred pharmacy and lab",
      icon: <EnvironmentOutlined />,
    },
    {
      title: "Professional Review",
      description:
        "Clinical staff review and refine patient forms before approval. AI-generated content may contain errors and requires human verification.",
      icon: <SearchOutlined />,
    },
    {
      title: "Fax Confirmation",
      description: "Finalize and send forms to facilities",
      icon: <SendOutlined />,
    },
  ];
  const [current, setCurrent] = useState(0);

  // Check if diagnosis is loaded (only for step 0)
  const canProceedFromStep1 =
    current === 0 ? diagnosisInfo && diagnosisInfo.length > 0 : true;

  // Check if orders are generated (step 1: Agent Doc Generation)
  const canProceedFromStep2 =
    current === 1
      ? Boolean(hasGeneratedOrders && prescriptionId && requisitionId)
      : true;

  // Check if pharmacy and lab are selected (only for step 2)
  const canProceedFromStep3 =
    current === 2 ? Boolean(selectedPharmacy && selectedLab) : true;

  // Check if orders are submitted (only for step 3)
  const canProceedFromStep4 = current === 3 ? isOrderSubmitted : true;

  // Combined check for Next button
  const canProceed =
    canProceedFromStep1 &&
    canProceedFromStep2 &&
    canProceedFromStep3 &&
    canProceedFromStep4;

  const next = () => {
    setCurrent(current + 1);
    // Delay scroll to allow page transition animation to start
    setTimeout(() => {
      window.scrollTo({ top: 200, behavior: "smooth" });
    }, 50);
  };
  const prev = () => {
    // Clear diagnosis when going back to step 1 (from step 2)
    if (current === 1) {
      updateDiagnosisInfo(null);
      updateOrderIds(null, null);
    }
    setCurrent(current - 1);
    // Delay scroll to allow page transition animation to start
    setTimeout(() => {
      window.scrollTo({ top: 200, behavior: "smooth" });
    }, 50);
  };

  // If completed, show completion page
  if (isCompleted) {
    return (
      <div className="min-h-screen w-full p-8 relative">
        <div className="max-w-7xl mx-auto">
          <div className="glass-card p-8">
            <CompletionPage />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full p-8 relative bg-slate-50">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-cyan-50/80 to-transparent -z-10" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-100/50 rounded-full blur-3xl mix-blend-multiply -z-10" />
        <div className="absolute top-1/3 -left-24 w-72 h-72 bg-teal-100/50 rounded-full blur-3xl mix-blend-multiply -z-10" />
      </div>

      {/* Header with clickable title to go back to Home */}
      <div className="max-w-7xl mx-auto mb-12 text-center relative z-10">
        <div className="inline-flex items-center justify-center p-3 bg-white rounded-2xl shadow-md mb-6 ring-1 ring-slate-100">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-200/50">
            <MedicineBoxOutlined className="text-white text-2xl" />
          </div>
        </div>
        <h1
          className="text-4xl md:text-5xl font-black text-slate-900 mb-3 tracking-tight cursor-pointer select-none"
          onClick={() => {
            try {
              // Use navigate from react-router without extra packages
              const navEvent = new MouseEvent("click", { bubbles: true });
              // Fallback: assign location to ensure navigation
              window.location.assign("/landing");
            } catch (e) {
              window.location.href = "/landing";
            }
          }}
          title="Back to Home"
        >
          Digital Medical{" "}
          <span className="bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
            Document Workflow
          </span>
        </h1>
        <p className="text-slate-500 text-lg max-w-2xl mx-auto font-medium">
          Agent-driven E-Health App for Seamless Prescription & Requisition
        </p>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-12 gap-6 relative z-10 items-stretch">
        {/* Left Steps Panel - Sticky */}
        <div className="col-span-3">
          <div className="sticky top-4 glass-card p-6 flex flex-col">
            <div className="mb-6 flex-shrink-0">
              <h3 className="text-xl font-bold text-gray-800 mb-1">
                Progress Tracker
              </h3>
              <p className="text-sm text-gray-500">
                Step {current + 1} of {steps.length}
              </p>
            </div>
            <div className="flex-1 flex items-stretch">
              <CustomSteps steps={steps} current={current} />
            </div>
          </div>
        </div>

        {/* Main Content Area - No min height restriction */}
        <div className="col-span-9">
          <div className="glass-card p-8 flex flex-col h-full">
            {/* Step Title */}
            <div className="mb-0 flex items-center justify-between">
              <div className="flex items-baseline">
                <h2 className="text-3xl font-bold gradient-text">
                  {steps[current].title}
                </h2>
                <p className="text-gray-600 text-base ml-4">
                  {steps[current].description}
                </p>
              </div>
              {/* <Button
                onClick={() => setShowSidebar(!showSidebar)}
                icon={<RobotOutlined />}
                size="large"
                className="premium-button shadow-lg"
                style={{
                  background: showSidebar
                    ? "linear-gradient(135deg, #06b6d4 0%, #14b8a6 100%)"
                    : "white",
                  color: showSidebar ? "white" : "#06b6d4",
                  border: showSidebar ? "none" : "2px solid #06b6d4",
                  fontWeight: 600,
                  height: "44px",
                  padding: "0 24px",
                }}
              >
                AI Assistant
              </Button> */}
            </div>

            {/* Step Content with Animation */}
            <div className="flex-1 relative">
              <TransitionGroup component={null}>
                <CSSTransition key={current} timeout={500} classNames="page">
                  <div className="w-full">
                    {current === 0 && <Step1 />}
                    {current === 1 && <Step2 />}
                    {current === 2 && <Step3 />}
                    {current === 3 && <Step4 />}
                    {current === 4 && <Step5 />}
                  </div>
                </CSSTransition>
              </TransitionGroup>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end items-center mt-6 pt-6 border-t-2 border-gray-200">
              {/* Hint Message for Step 4 */}
              {current === 3 && !isOrderSubmitted && (
                <div className="flex-1 mr-4">
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
                    <p className="text-sm text-yellow-800 font-medium">
                      ⚠️ Please click "Submit Orders" button to submit your
                      prescription and requisition before proceeding to the next
                      step.
                    </p>
                  </div>
                </div>
              )}
              <div className="flex gap-3">
                {current > 0 && current !== 2 && (
                  <Button
                    onClick={() => prev()}
                    size="large"
                    className="premium-button"
                    disabled={current === 3 && isOrderSubmitted}
                    style={{
                      fontWeight: 600,
                      border: "2px solid #d1d5db",
                      opacity: current === 3 && isOrderSubmitted ? 0.5 : 1,
                      cursor:
                        current === 3 && isOrderSubmitted
                          ? "not-allowed"
                          : "pointer",
                    }}
                  >
                    Previous
                  </Button>
                )}
                {current < steps.length - 1 && (
                  <Button
                    type="primary"
                    onClick={() => next()}
                    size="large"
                    className="premium-button"
                    disabled={!canProceed}
                    style={{
                      background:
                        "linear-gradient(135deg, #06b6d4 0%, #14b8a6 100%)",
                      border: "none",
                      fontWeight: 600,
                      opacity: !canProceed ? 0.5 : 1,
                      cursor: !canProceed ? "not-allowed" : "pointer",
                    }}
                  >
                    Next Step
                  </Button>
                )}
                {current === steps.length - 1 && (
                  <Button
                    type="primary"
                    onClick={() => {
                      setIsCompleted(true);
                      message.success("All processes completed successfully!");
                    }}
                    size="large"
                    className="premium-button"
                    icon={<SendOutlined />}
                    style={{
                      background:
                        "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                      border: "none",
                      fontWeight: 600,
                    }}
                  >
                    Done!
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Assistant Sidebar */}
      {showSidebar && (
        <div className="fixed top-8 bottom-8 right-8 w-[380px] z-50 animate-in slide-in-from-right duration-300">
          <Card
            className="glass-card h-full border-2 border-cyan-200/50 shadow-2xl"
            bodyStyle={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              padding: "24px",
            }}
          >
            <div className="flex items-center justify-between mb-4 pb-4 border-b-2 border-gray-200 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 flex items-center justify-center floating shadow-lg shadow-cyan-500/50">
                  <RobotOutlined className="text-white text-xl" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-gray-800 m-0">
                    AI Assistant
                  </h3>
                  <p className="text-sm text-gray-500 m-0">Here to help you</p>
                </div>
              </div>
              <Button
                type="text"
                icon={<CloseOutlined />}
                onClick={() => setShowSidebar(false)}
                className="hover:bg-gray-100 transition-colors"
                style={{
                  color: "#6b7280",
                  width: "32px",
                  height: "32px",
                  padding: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              />
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
export default App;
