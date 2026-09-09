"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { PageHeader } from "@/shared/components/ui/page-header";
import { Button } from "@/shared/components/ui/button";
import { formatDate } from "@/shared/lib/format";
import { admissionLetterApi, type AdmissionLetterData } from "../api/admissionLetterApi";
import { FileTextIcon, DownloadIcon } from "@/shared/components/ui/icons";

function genderLabel(g: string | null): string {
  if (g === "MALE") return "Male";
  if (g === "FEMALE") return "Female";
  if (g === "OTHER") return "Other";
  return "—";
}

export function AdmissionLetterPage() {
  const [data, setData] = useState<AdmissionLetterData | null>(null);
  const [loading, setLoading] = useState(true);
  const letterRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const result = await admissionLetterApi.get();
    setData(result);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handlePrint = () => {
    const content = letterRef.current;
    if (!content) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Admission Letter</title>
      <style>
        body { font-family: Satoshi, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 40px; color: #404040; font-size: 15px; line-height: 24px; }
        .header { text-align: center; border-bottom: 2px solid #171717; padding-bottom: 16px; margin-bottom: 24px; }
        .school-name { font-family: Satoshi, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 24px; line-height: 32px; font-weight: 700; letter-spacing: -0.015em; color: #064e3b; margin: 0; }
        .subtitle { font-size: 14px; line-height: 20px; color: #525252; margin-top: 4px; }
        .date { text-align: right; margin-bottom: 24px; font-size: 12px; line-height: 18px; color: #525252; font-variant-numeric: tabular-nums; }
        .body { font-size: 15px; line-height: 24px; }
        .body p { margin: 12px 0; }
        .details-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .details-table td { padding: 8px 12px; border: 1px solid #ddd; font-size: 14px; font-variant-numeric: tabular-nums; }
        .details-table td:first-child { font-weight: 600; color: #171717; width: 40%; background: #f9f9f9; }
        .signature { margin-top: 48px; display: flex; justify-content: space-between; }
        .sig-block { text-align: center; width: 200px; }
        .sig-line { border-top: 1px solid #1a1a1a; margin-top: 40px; padding-top: 8px; font-size: 13px; }
        @media print { body { margin: 20px; } }
      </style></head><head></head><body>
      ${content.innerHTML}
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <PageHeader title="Admission Letter" description="Your official admission document" />
        <div className="rounded-lg border border-neutral-200 bg-bg-default p-8 text-center text-sm text-neutral-400">
          Loading...
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <PageHeader title="Admission Letter" description="Your official admission document" />
        <div className="rounded-lg border border-neutral-200 bg-bg-default p-8 text-center text-sm text-neutral-400">
          No admission record found.
        </div>
      </div>
    );
  }

  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Admission Letter"
        description="Your official admission document"
        actions={
          <Button
            text="Print / Download"
            icon={<DownloadIcon className="size-4" />}
            className="w-auto"
            onClick={handlePrint}
          />
        }
      />

      <div
        className="rounded-lg border border-neutral-200 bg-white p-6 sm:p-10 shadow-sm"
        ref={letterRef}
      >
        <div className="header text-center border-b-2 border-neutral-900 pb-4 mb-6">
          <p className="school-name type-display text-content-brand">{data.schoolName}</p>
          <p className="subtitle type-body-secondary mt-1">Official Admission Letter</p>
        </div>

        <div className="date type-caption type-numeric mb-6 text-right">Date: {today}</div>

        <div className="body type-body-reading space-y-4">
          <p>
            Dear <span className="font-semibold text-neutral-900">{data.studentName}</span>,
          </p>

          <p>
            We are pleased to confirm your admission to{" "}
            <span className="font-semibold">{data.schoolName}</span> for the academic year{" "}
            <span className="font-semibold">{data.academicYear || "N/A"}</span>.
          </p>

          <p>Please find your admission details below:</p>

          <table className="details-table w-full border-collapse my-5">
            <tbody>
              <tr>
                <td className="font-semibold bg-neutral-50 border border-neutral-200 px-3 py-2">
                  Student Name
                </td>
                <td className="border border-neutral-200 px-3 py-2">{data.studentName}</td>
              </tr>
              <tr>
                <td className="font-semibold bg-neutral-50 border border-neutral-200 px-3 py-2">
                  Admission Number
                </td>
                <td className="border border-neutral-200 px-3 py-2">{data.admissionNumber}</td>
              </tr>
              <tr>
                <td className="font-semibold bg-neutral-50 border border-neutral-200 px-3 py-2">
                  Admission Date
                </td>
                <td className="border border-neutral-200 px-3 py-2">
                  {formatDate(data.admissionDate)}
                </td>
              </tr>
              <tr>
                <td className="font-semibold bg-neutral-50 border border-neutral-200 px-3 py-2">
                  Class
                </td>
                <td className="border border-neutral-200 px-3 py-2">{data.className || "N/A"}</td>
              </tr>
              <tr>
                <td className="font-semibold bg-neutral-50 border border-neutral-200 px-3 py-2">
                  Section
                </td>
                <td className="border border-neutral-200 px-3 py-2">{data.sectionName || "N/A"}</td>
              </tr>
              {data.dateOfBirth && (
                <tr>
                  <td className="font-semibold bg-neutral-50 border border-neutral-200 px-3 py-2">
                    Date of Birth
                  </td>
                  <td className="border border-neutral-200 px-3 py-2">
                    {formatDate(data.dateOfBirth)}
                  </td>
                </tr>
              )}
              {data.gender && (
                <tr>
                  <td className="font-semibold bg-neutral-50 border border-neutral-200 px-3 py-2">
                    Gender
                  </td>
                  <td className="border border-neutral-200 px-3 py-2">
                    {genderLabel(data.gender)}
                  </td>
                </tr>
              )}
              <tr>
                <td className="font-semibold bg-neutral-50 border border-neutral-200 px-3 py-2">
                  Academic Year
                </td>
                <td className="border border-neutral-200 px-3 py-2">
                  {data.academicYear || "N/A"}
                </td>
              </tr>
            </tbody>
          </table>

          <p>
            We wish you a successful and enriching academic journey with us. Should you have any
            questions, please do not hesitate to contact the school office.
          </p>

          <p>Warm regards,</p>

          <div className="mt-12 flex justify-between">
            <div className="text-center w-48">
              <div className="border-t border-neutral-900 mt-10 pt-2 text-sm">
                Principal
                <br />
                <span className="text-xs text-neutral-500">{data.schoolName}</span>
              </div>
            </div>
            <div className="text-center w-48">
              <div className="border-t border-neutral-900 mt-10 pt-2 text-sm">
                Student / Parent
                <br />
                <span className="text-xs text-neutral-500">Signature</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdmissionLetterPage;
