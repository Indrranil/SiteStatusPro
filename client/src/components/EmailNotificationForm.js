import React, { useState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

const EmailNotificationForm = ({ website, isDown }) => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(null); // 'success' | 'error' | null
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      setStatus("error");
      setMessage("Please enter your email address");
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:5001/api/v1/notifications/subscribe",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            website,
          }),
        },
      );

      if (response.ok) {
        setStatus("success");
        setMessage("You will be notified when the website is back online");
        setEmail("");
      } else {
        const data = await response.json();
        setStatus("error");
        setMessage(data.message || "Failed to subscribe for notifications");
      }
    } catch (error) {
      setStatus("error");
      setMessage("Failed to subscribe for notifications");
    }
  };

  if (!isDown) {
    return null;
  }

  return (
    <div className="mt-6 max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            Get notified when {website} is back online
          </label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full rounded-l-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Enter your email"
            />
            <button
              type="submit"
              className="inline-flex items-center rounded-r-md border border-l-0 border-gray-300 bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Notify Me
            </button>
          </div>
        </div>

        {status && (
          <Alert variant={status === "success" ? "default" : "destructive"}>
            {status === "success" ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertTitle>
              {status === "success" ? "Success" : "Error"}
            </AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}
      </form>
    </div>
  );
};

export default EmailNotificationForm;
