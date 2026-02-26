"use client";

import { SOSCategory, SOSStatus } from "@prisma/client";
import { TbAlertTriangle, TbHome, TbScale, TbHeartbeat, TbShield, TbCurrencyRupee, TbGavel } from "react-icons/tb";

type SOSCardProps = {
  sos: {
    id: string;
    category: SOSCategory;
    urgency: 1 | 2 | 3;
    content: string;
    requester: {
      name: string | null;
      state: string | null;
      trustScore: number;
    };
    responseCount: number;
    status: SOSStatus;
    createdAt: Date | string;
  };
  onRespond: (sosId: string) => void;
};

const categoryIcons: Record<SOSCategory, any> = {
  HOUSING: TbHome,
  LEGAL: TbGavel,
  MEDICAL: TbHeartbeat,
  SAFETY: TbShield,
  LOAN: TbCurrencyRupee,
  PAYMENT: TbScale,
  OTHER: TbAlertTriangle,
};

const categoryLabels: Record<SOSCategory, string> = {
  HOUSING: "Housing",
  LEGAL: "Legal",
  MEDICAL: "Medical",
  SAFETY: "Safety",
  LOAN: "Loan",
  PAYMENT: "Payment",
  OTHER: "Other",
};

export default function SOSCard({ sos, onRespond }: SOSCardProps) {
  const Icon = categoryIcons[sos.category] || TbAlertTriangle;
  const isResolved = sos.status === SOSStatus.RESOLVED;

  const getUrgencyStyle = () => {
    if (sos.urgency === 1) {
      return "bg-red-50 border-red-500 border-2 animate-pulse";
    }
    if (sos.urgency === 2) {
      return "bg-amber-50 border-amber-400 border-2";
    }
    return "bg-white border-l-4 border-blue-400";
  };

  return (
    <div className={`rounded-2xl ${getUrgencyStyle()} p-5 shadow-md`}>
      {isResolved && (
        <div className="mb-3 rounded-lg bg-emerald-100 px-3 py-2 text-center text-sm font-medium text-emerald-700">
          ✅ Resolved
        </div>
      )}

      <div className="flex items-start gap-3">
        <div className="rounded-full bg-red-100 p-2">
          <Icon className="h-5 w-5 text-red-600" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
              {categoryLabels[sos.category]}
            </span>
            {sos.urgency === 1 && (
              <span className="flex items-center gap-1 rounded-full bg-red-200 px-2 py-0.5 text-xs font-bold text-red-800">
                🚨 CRITICAL
              </span>
            )}
          </div>

          <p className="mt-2 text-gray-900">{sos.content}</p>

          <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
            <span>
              {sos.requester.name || "Anonymous"} • {sos.requester.state}
            </span>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">
              Trust: {sos.requester.trustScore}
            </span>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm text-gray-600">
              {sos.responseCount} member{sos.responseCount !== 1 ? "s" : ""} responded
            </span>
            {!isResolved && (
              <button
                onClick={() => onRespond(sos.id)}
                className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700 transition-colors"
              >
                I Can Help
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
