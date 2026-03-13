import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  deleteEmployeeDocument,
  getEmployeeDocuments,
  getEmployeeProfile,
  updateEmployeeProfile,
  uploadEmployeeDocument,
} from "../api/staffApi";
import { useAuth } from "../context/AuthContext";

const emptyForm = {
  personalInfo: {
    name: "",
    email: "",
    phone: "",
    address: "",
    emergencyContact: {
      name: "",
      phone: "",
      relationship: "",
    },
  },
  jobInfo: {
    role: "Employee",
    department: "",
    startDate: "",
    salary: 0,
    employmentType: "",
  },
  notes: "",
};

export default function EmployeeProfilePage() {
  const { id: routeId } = useParams();
  const { user, isManager } = useAuth();
  const employeeId = useMemo(() => routeId || user?.id, [routeId, user?.id]);
  const [profile, setProfile] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [docName, setDocName] = useState("");
  const [docType, setDocType] = useState("");
  const [docFile, setDocFile] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!employeeId) return;
    loadProfile(employeeId);
  }, [employeeId]);

  const loadProfile = async (id) => {
    setLoading(true);
    setError("");
    try {
      const [profileRes, documentsRes] = await Promise.all([
        getEmployeeProfile(id),
        getEmployeeDocuments(id),
      ]);
      setProfile(profileRes.data);
      setDocuments(documentsRes.data.documents || []);
      setForm({
        personalInfo: {
          name: profileRes.data.personalInfo?.name || "",
          email: profileRes.data.personalInfo?.email || "",
          phone: profileRes.data.personalInfo?.phone || "",
          address: profileRes.data.personalInfo?.address || "",
          emergencyContact: {
            name: profileRes.data.personalInfo?.emergencyContact?.name || "",
            phone: profileRes.data.personalInfo?.emergencyContact?.phone || "",
            relationship: profileRes.data.personalInfo?.emergencyContact?.relationship || "",
          },
        },
        jobInfo: {
          role: profileRes.data.jobInfo?.role || "Employee",
          department: profileRes.data.jobInfo?.department || "",
          startDate: profileRes.data.jobInfo?.startDate || "",
          salary: profileRes.data.jobInfo?.salary || 0,
          employmentType: profileRes.data.jobInfo?.employmentType || "",
        },
        notes: profileRes.data.notes || "",
      });
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load employee record");
    } finally {
      setLoading(false);
    }
  };

  const setPersonalField = (field, value) => {
    setForm((prev) => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, [field]: value },
    }));
  };

  const setEmergencyField = (field, value) => {
    setForm((prev) => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        emergencyContact: { ...prev.personalInfo.emergencyContact, [field]: value },
      },
    }));
  };

  const setJobField = (field, value) => {
    setForm((prev) => ({
      ...prev,
      jobInfo: { ...prev.jobInfo, [field]: value },
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!employeeId) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await updateEmployeeProfile(employeeId, form);
      setProfile(res.data);
      setDocuments(res.data.documents || []);
      setSuccess("Employee record updated.");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update employee record");
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!employeeId || !docFile) {
      setError("Choose a document file to upload");
      return;
    }
    setUploading(true);
    setError("");
    setSuccess("");
    try {
      const payload = new FormData();
      payload.append("document", docFile);
      if (docName) payload.append("name", docName);
      if (docType) payload.append("type", docType);

      const res = await uploadEmployeeDocument(employeeId, payload);
      setProfile(res.data);
      setDocuments(res.data.documents || []);
      setDocName("");
      setDocType("");
      setDocFile(null);
      setSuccess("Document uploaded.");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to upload document");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (!window.confirm("Delete this document?")) return;
    setError("");
    setSuccess("");
    try {
      const res = await deleteEmployeeDocument(employeeId, docId);
      setProfile(res.data);
      setDocuments(res.data.documents || []);
      setSuccess("Document deleted.");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete document");
    }
  };

  if (loading) {
    return <div style={{ padding: 20 }}>Loading employee record...</div>;
  }

  if (!profile) {
    return <div style={{ padding: 20 }}>Employee record not found.</div>;
  }

  return (
    <div style={{ padding: 20, maxWidth: 980 }}>
      <h1>{isManager ? "Employee Record" : "My Profile"}</h1>
      <p style={{ color: "#666", marginBottom: 20 }}>
        {profile.personalInfo.name} · {profile.jobInfo.role}
      </p>

      {error && <p style={{ color: "crimson", marginBottom: 8 }}>{error}</p>}
      {success && <p style={{ color: "green", marginBottom: 8 }}>{success}</p>}

      <form onSubmit={handleSave}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
          <section style={{ border: "1px solid #eee", borderRadius: 8, padding: 16 }}>
            <h2 style={{ marginTop: 0 }}>Personal Info</h2>
            <div style={{ display: "grid", gap: 10 }}>
              <input value={form.personalInfo.name} onChange={(e) => setPersonalField("name", e.target.value)} placeholder="Name" style={{ padding: 8 }} />
              <input value={form.personalInfo.email} onChange={(e) => setPersonalField("email", e.target.value)} placeholder="Email" disabled={!isManager} style={{ padding: 8, background: isManager ? "#fff" : "#f7f7f7" }} />
              <input value={form.personalInfo.phone} onChange={(e) => setPersonalField("phone", e.target.value)} placeholder="Phone" style={{ padding: 8 }} />
              <input value={form.personalInfo.address} onChange={(e) => setPersonalField("address", e.target.value)} placeholder="Address" style={{ padding: 8 }} />
            </div>

            <h3>Emergency Contact</h3>
            <div style={{ display: "grid", gap: 10 }}>
              <input value={form.personalInfo.emergencyContact.name} onChange={(e) => setEmergencyField("name", e.target.value)} placeholder="Contact name" style={{ padding: 8 }} />
              <input value={form.personalInfo.emergencyContact.phone} onChange={(e) => setEmergencyField("phone", e.target.value)} placeholder="Contact phone" style={{ padding: 8 }} />
              <input value={form.personalInfo.emergencyContact.relationship} onChange={(e) => setEmergencyField("relationship", e.target.value)} placeholder="Relationship" style={{ padding: 8 }} />
            </div>
          </section>

          <section style={{ border: "1px solid #eee", borderRadius: 8, padding: 16 }}>
            <h2 style={{ marginTop: 0 }}>Job Info</h2>
            <div style={{ display: "grid", gap: 10 }}>
              <input value={form.jobInfo.role} onChange={(e) => setJobField("role", e.target.value)} placeholder="Role" disabled={!isManager} style={{ padding: 8, background: isManager ? "#fff" : "#f7f7f7" }} />
              <input value={form.jobInfo.department} onChange={(e) => setJobField("department", e.target.value)} placeholder="Department" disabled={!isManager} style={{ padding: 8, background: isManager ? "#fff" : "#f7f7f7" }} />
              <input type="date" value={form.jobInfo.startDate} onChange={(e) => setJobField("startDate", e.target.value)} disabled={!isManager} style={{ padding: 8, background: isManager ? "#fff" : "#f7f7f7" }} />
              <input type="number" value={form.jobInfo.salary} onChange={(e) => setJobField("salary", e.target.value)} disabled={!isManager} style={{ padding: 8, background: isManager ? "#fff" : "#f7f7f7" }} />
              <select value={form.jobInfo.employmentType} onChange={(e) => setJobField("employmentType", e.target.value)} disabled={!isManager} style={{ padding: 8, background: isManager ? "#fff" : "#f7f7f7" }}>
                <option value="">Employment type</option>
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Temporary">Temporary</option>
              </select>
            </div>

            <h3>Manager Notes</h3>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              rows={6}
              disabled={!isManager}
              style={{ width: "100%", padding: 8, background: isManager ? "#fff" : "#f7f7f7" }}
            />
          </section>
        </div>

        <button type="submit" disabled={saving} style={{ padding: "8px 16px", marginBottom: 24 }}>
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </form>

      <section style={{ border: "1px solid #eee", borderRadius: 8, padding: 16 }}>
        <h2 style={{ marginTop: 0 }}>Documents</h2>
        {isManager && (
          <form onSubmit={handleUpload} style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginBottom: 16 }}>
            <input value={docName} onChange={(e) => setDocName(e.target.value)} placeholder="Document name" style={{ padding: 8 }} />
            <input value={docType} onChange={(e) => setDocType(e.target.value)} placeholder="Type (contract, ID, tax form...)" style={{ padding: 8, width: 220 }} />
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setDocFile(e.target.files?.[0] || null)} />
            <button type="submit" disabled={uploading}>{uploading ? "Uploading..." : "Upload Document"}</button>
          </form>
        )}

        {documents.length === 0 ? (
          <p style={{ color: "#666" }}>No documents uploaded yet.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #ddd" }}>
                <th style={{ textAlign: "left", padding: 8 }}>Name</th>
                <th style={{ textAlign: "left", padding: 8 }}>Type</th>
                <th style={{ textAlign: "left", padding: 8 }}>File</th>
                <th style={{ textAlign: "left", padding: 8 }}>Uploaded</th>
                {isManager && <th style={{ padding: 8 }}></th>}
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: 8 }}>{doc.name}</td>
                  <td style={{ padding: 8 }}>{doc.type || "—"}</td>
                  <td style={{ padding: 8 }}>
                    <a href={doc.url} target="_blank" rel="noreferrer">{doc.mimeType}</a>
                  </td>
                  <td style={{ padding: 8 }}>
                    {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : "—"}
                  </td>
                  {isManager && (
                    <td style={{ padding: 8 }}>
                      <button type="button" onClick={() => handleDeleteDocument(doc.id)} style={{ color: "#c00" }}>
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
