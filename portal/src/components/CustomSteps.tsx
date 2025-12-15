import React from "react";
import { CheckOutlined } from "@ant-design/icons";

interface Step {
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface CustomStepsProps {
  steps: Step[];
  current: number;
}

const CustomSteps: React.FC<CustomStepsProps> = ({ steps, current }) => {
  return (
    <div className="relative">
      {/* Steps */}
      <div className="space-y-6">
        {steps.map((step, index) => {
          const isCompleted = index < current;
          const isCurrent = index === current;
          const isLast = index === steps.length - 1;

          return (
            <div
              key={index}
              className={`relative flex items-start gap-4 transition-all duration-500 ${
                isCurrent ? "scale-100" : ""
              }`}
            >
              {/* Vertical Connector Line for each step (except the last) */}
              {!isLast && (
                <div
                  className="absolute left-6 top-5 w-0.5 bg-gray-200"
                  style={{ height: "calc(100% + 1.5rem)" }}
                />
              )}
              {isCompleted && !isLast && (
                <div
                  className="absolute left-6 top-5 w-0.5 bg-gradient-to-b from-cyan-500 to-teal-500"
                  style={{ height: "calc(100% + 1.5rem)" }}
                />
              )}

              {/* Icon Circle */}
              <div className="relative z-10 flex-shrink-0 w-12 flex justify-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
                    isCompleted
                      ? "bg-gradient-to-br from-cyan-500 to-teal-500 shadow-lg shadow-cyan-500/50"
                      : isCurrent
                      ? "bg-gradient-to-br from-cyan-500 to-teal-500 shadow-xl shadow-cyan-500/60 current-step-glow"
                      : "bg-gray-200"
                  }`}
                >
                  {isCompleted ? (
                    <CheckOutlined className="text-white text-xl" />
                  ) : (
                    <span
                      className={`text-xl ${
                        isCurrent ? "text-white" : "text-gray-400"
                      }`}
                    >
                      {step.icon}
                    </span>
                  )}
                </div>

                {/* Ripple Effect for Current Step */}
                {isCurrent && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-12 h-12 rounded-full bg-cyan-400/20 current-step-ring" />
                  </div>
                )}
              </div>

              {/* Step Content */}
              <div className="flex-1 pt-2">
                <h4
                  className={`font-semibold text-base mb-1 transition-all duration-300 ${
                    isCurrent
                      ? "text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-teal-600"
                      : isCompleted
                      ? "text-gray-700"
                      : "text-gray-400"
                  }`}
                >
                  {step.title}
                </h4>
                <p
                  className={`text-sm transition-all duration-300 ${
                    isCurrent
                      ? "text-gray-600 font-medium"
                      : isCompleted
                      ? "text-gray-500"
                      : "text-gray-400"
                  }`}
                >
                  {step.description}
                </p>

                {/* Progress Badge */}
                {isCurrent && (
                  <div className="mt-0 inline-block">
                    <span className="px-3 py-1 bg-gradient-to-r from-cyan-100 to-teal-100 text-cyan-700 text-xs font-semibold rounded-full">
                      In Progress
                    </span>
                  </div>
                )}

                {isCompleted && (
                  <div className="mt-0 inline-block">
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                      Completed
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CustomSteps;
