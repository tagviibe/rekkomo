"use client";

import { useState } from "react";
import { TbX } from "react-icons/tb";

type SOSResponseModalProps = {
  isOpen: boolean;
  sosId: string;
  onRespond: (message: string, shareContact: boolean) => void;
  onClose: () => void;
};

export default function SOSResponseModal({
  isOpen,
  sosId,
  onRespond,
  onClose,
}: SOSResponseModalProps) {
  const [message, setMessage] = useState("");
  const [shareContact, setShareContact] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (message.trim()) {
      onRespond(message, shareContact);
      setMessage("");
      setShareContact(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">I Can Help</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 hover:bg-gray-100"
          >
            <TbX className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Your message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="w-full rounded-lg border p-3 text-sm"
              placeholder="How can you help? Share your contact details or specific assistance..."
            />
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={shareContact}
              onChange={(e) => setShareContact(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">
              Share my contact information
            </span>
          </label>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 rounded-lg border px-4 py-2 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!message.trim()}
              className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              Send Response
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
