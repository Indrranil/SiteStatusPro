// src/components/Terms.js
import React from "react";
import { Card } from "@/components/ui/card";

const Terms = () => {
  return (
    <Card className="max-w-4xl mx-auto p-8 my-8">
      <h1 className="text-2xl font-bold mb-6">Terms of Service</h1>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
        <p className="mb-3">
          Welcome to SiteStatusPro. By accessing or using our website monitoring
          service, you agree to be bound by these terms of service.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">2. Service Description</h2>
        <p className="mb-3">
          SiteStatusPro is a website monitoring service that tracks and reports
          the status and availability of various websites and online services.
          We provide:
        </p>
        <ul className="list-disc ml-6 mb-3">
          <li>Real-time website status monitoring</li>
          <li>Outage reporting and tracking</li>
          <li>Historical outage data</li>
          <li>User-submitted problem reports</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">3. User Responsibilities</h2>
        <p className="mb-3">Users agree to:</p>
        <ul className="list-disc ml-6 mb-3">
          <li>Provide accurate information when reporting issues</li>
          <li>Not misuse or attempt to manipulate the reporting system</li>
          <li>Not use the service for any unlawful purpose</li>
          <li>Not interfere with the proper operation of the service</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">4. Service Limitations</h2>
        <p className="mb-3">
          While we strive to provide accurate and timely information:
        </p>
        <ul className="list-disc ml-6 mb-3">
          <li>We cannot guarantee 100% accuracy of status reports</li>
          <li>There may be delays in updating status information</li>
          <li>The service may occasionally be unavailable for maintenance</li>
          <li>
            We rely partially on user-submitted reports which may vary in
            accuracy
          </li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">
          5. Privacy and Data Collection
        </h2>
        <p className="mb-3">We collect and store:</p>
        <ul className="list-disc ml-6 mb-3">
          <li>Website status data</li>
          <li>User-submitted reports</li>
          <li>Basic usage analytics</li>
          <li>Anonymous error reports</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">6. Donations</h2>
        <p className="mb-3">
          While our service is free to use, we accept donations to help maintain
          and improve the platform. Donations are:
        </p>
        <ul className="list-disc ml-6 mb-3">
          <li>Completely voluntary</li>
          <li>Non-refundable</li>
          <li>Used to support service maintenance and development</li>
          <li>Processed securely through Ko-fi</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">7. Disclaimer</h2>
        <p className="mb-3">
          SiteStatusPro is provided "as is" without any warranties of any kind.
          We do not guarantee continuous, uninterrupted access to the service.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">8. Changes to Terms</h2>
        <p className="mb-3">
          We reserve the right to modify these terms at any time. Continued use
          of the service after any changes constitutes acceptance of the new
          terms.
        </p>
      </section>

      <footer className="mt-8 text-sm text-gray-600">
        <p>Last updated: October 26, 2024</p>
        <p>
          Contact: For any questions regarding these terms, please submit an
          issue through our GitHub repository.
        </p>
      </footer>
    </Card>
  );
};

export default Terms;
