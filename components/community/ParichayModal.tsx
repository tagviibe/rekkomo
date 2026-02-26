"use client";

import { useState } from "react";
import { TbX } from "react-icons/tb";

type ParichayModalProps = {
  isOpen: boolean;
  requester: {
    id: string;
    name: string | null;
  };
  target: {
    id: string;
    name: string | null;
  };
  availableConnectors: Array<{
    id: string;
    name: string | null;
    state: string | null;
  }>;
  onSubmit: (connectorId: string, note: string) => void;
  onClose: () => void;
};

export default function ParichayModal({
  isOpen,
  requester,
  target,
  availableConnectors,
  onSubmit,
  onClose,
}: ParichayModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedConnector, setSelectedConnector] = useState<string | null>(null);
  const [note, setNote] = useState("");

  if (!isOpen) return null;

  const handleConnectorSelect = (connectorId: string) => {
    setSelectedConnector(connectorId);
    setStep(2);
    // Pre-fill note suggestion
    const connector = availableConnectors.find((c) => c.id === connectorId);
    setNote(
      `Hi ${connector?.name || "there"}, could you please introduce me to ${target.name || "this person"}? I'd like to connect with them.`
    );
  };

  const handleSubmit = () => {
    if (selectedConnector && note.trim()) {
      onSubmit(selectedConnector, note);
      setStep(1);
      setSelectedConnector(null);
      setNote("");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Request Introduction</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 hover:bg-gray-100"
          >
            <TbX className="h-5 w-5" />
          </button>
        </div>

        {step === 1 ? (
          <div>
            <p className="mb-4 text-sm text-gray-600">
              Who can introduce you to <strong>{target.name}</strong>?
            </p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {availableConnectors.length === 0 ? (
                <p className="text-sm text-gray-500">No mutual connections found</p>
              ) : (
                availableConnectors.map((connector) => (
                  <button
                    key={connector.id}
                    onClick={() => handleConnectorSelect(connector.id)}
                    className="w-full rounded-lg border p-3 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-medium">{connector.name}</div>
                    <div className="text-xs text-gray-500">{connector.state}</div>
                  </button>
                ))
              )}
            </div>
          </div>
        ) : (
          <div>
            <p className="mb-4 text-sm text-gray-600">
              Write a note for your connector (max 120 characters):
            </p>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={120}
              rows={4}
              className="w-full rounded-lg border p-3 text-sm"
              placeholder="Write your introduction request..."
            />
            <div className="mt-2 text-xs text-gray-500 text-right">
              {note.length}/120
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setStep(1)}
                className="flex-1 rounded-lg border px-4 py-2 text-sm font-medium"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={!note.trim()}
                className="flex-1 rounded-lg bg-[#2B4FD4] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                Send Request
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
