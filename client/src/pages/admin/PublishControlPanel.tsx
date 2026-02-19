// ============================================================================
// Publish Control Panel - Granular Publish/Unpublish UI
// ============================================================================

import { useState } from "react";
type EntityType = "page" | "section" | "item";
type Action = "publish" | "unpublish" | "publish-with-items" | "unpublish-with-items";

interface PublishResult {
  ok: boolean;
  data?: {
    pageId?: number;
    sectionId?: number;
    itemId?: number;
    action: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

export default function PublishControlPanel() {
  const [adminToken, setAdminToken] = useState("");
  const [entityType, setEntityType] = useState<EntityType>("section");
  const [entityId, setEntityId] = useState("");
  const [action, setAction] = useState<Action>("publish");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PublishResult | null>(null);

  // Load admin token from localStorage on mount
  useState(() => {
    const token = localStorage.getItem("adminToken");
    if (token) setAdminToken(token);
  });

  const executeAction = async () => {
    setLoading(true);
    setResult(null);

    try {
      // Validate inputs
      if (!adminToken.trim()) {
        setResult({
          ok: false,
          error: {
            code: "MISSING_TOKEN",
            message: "Admin token is required. Please login first.",
          },
        });
        setLoading(false);
        return;
      }

      const id = parseInt(entityId);
      if (isNaN(id) || id <= 0) {
        setResult({
          ok: false,
          error: {
            code: "INVALID_ID",
            message: "Please enter a valid positive integer ID",
          },
        });
        setLoading(false);
        return;
      }

      // Build URL
      let endpoint = "";
      if (entityType === "page") {
        endpoint = `/api/admin/pages/${id}/${action}`;
      } else if (entityType === "section") {
        endpoint = `/api/admin/sections/${id}/${action}`;
      } else if (entityType === "item") {
        endpoint = `/api/admin/items/${id}/${action}`;
      }

      const url = `/api/${endpoint}`;

      const response = await fetch(url, {
            credentials: 'include',
        method: "POST",
        headers: {"Content-Type": "application/json",
        },
      });

      const data: PublishResult = await response.json();
      setResult(data);

      if (data.ok) {
        console.log(`✅ ${entityType} ${id} ${action} successful`);
      }
    } catch (error) {
      setResult({
        ok: false,
        error: {
          code: "NETWORK_ERROR",
          message: error instanceof Error ? error.message : "Unknown error",
        },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen p-6"
      style={{
        backgroundColor: "var(--background)",
        fontFamily: "Inter",
        color: "var(--foreground)",
      }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1
            className="text-3xl md:text-4xl mb-2"
            style={{ fontFamily: "Fjalla One" }}
          >
            Granular Publish Control
          </h1>
          <p style={{ opacity: 0.7 }}>
            Publish/Unpublish einzelne Pages, Sections oder Items
          </p>
        </div>

        {/* Admin Token */}
        <div
          className="p-6 rounded-lg mb-6"
          style={{ backgroundColor: "var(--color-bg-light)" }}
        >
          <h2 className="text-xl font-bold mb-3" style={{ fontFamily: "Fjalla One" }}>
            🔐 Admin Token
          </h2>
          <input
            type="text"
            value={adminToken}
            onChange={(e) => setAdminToken(e.target.value)}
            placeholder="Admin Token (aus localStorage oder Login)"
            className="w-full px-4 py-2 rounded border"
            style={{
              backgroundColor: "var(--background)",
              borderColor: "var(--border)",
              color: "var(--foreground)",
            }}
          />
          <p className="text-sm mt-2" style={{ opacity: 0.7 }}>
            Token wird in der X-Admin-Token Header gesendet
          </p>
        </div>

        {/* Action Form */}
        <div
          className="p-6 rounded-lg mb-6"
          style={{ backgroundColor: "var(--color-bg-light)" }}
        >
          <h2 className="text-xl font-bold mb-4" style={{ fontFamily: "Fjalla One" }}>
            🎛️ Control Panel
          </h2>

          {/* Entity Type */}
          <div className="mb-4">
            <label className="block mb-2 font-semibold">Entity Type</label>
            <div className="flex gap-3">
              {(["page", "section", "item"] as EntityType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setEntityType(type)}
                  className="px-4 py-2 rounded font-semibold transition-all"
                  style={{
                    backgroundColor:
                      entityType === type ? "var(--color-coral)" : "var(--background)",
                    color: entityType === type ? "white" : "var(--foreground)",
                    border: `2px solid ${
                      entityType === type ? "var(--color-coral)" : "var(--border)"
                    }`,
                  }}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Entity ID */}
          <div className="mb-4">
            <label className="block mb-2 font-semibold">
              {entityType.charAt(0).toUpperCase() + entityType.slice(1)} ID
            </label>
            <input
              type="number"
              value={entityId}
              onChange={(e) => setEntityId(e.target.value)}
              placeholder="z.B. 1"
              min="1"
              className="w-full px-4 py-2 rounded border"
              style={{
                backgroundColor: "var(--background)",
                borderColor: "var(--border)",
                color: "var(--foreground)",
              }}
            />
          </div>

          {/* Action */}
          <div className="mb-4">
            <label className="block mb-2 font-semibold">Action</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setAction("publish")}
                className="px-4 py-2 rounded font-semibold transition-all"
                style={{
                  backgroundColor:
                    action === "publish" ? "rgb(34, 197, 94)" : "var(--background)",
                  color: action === "publish" ? "white" : "var(--foreground)",
                  border: `2px solid ${
                    action === "publish" ? "rgb(34, 197, 94)" : "var(--border)"
                  }`,
                }}
              >
                ✅ Publish
              </button>
              <button
                onClick={() => setAction("unpublish")}
                className="px-4 py-2 rounded font-semibold transition-all"
                style={{
                  backgroundColor:
                    action === "unpublish" ? "rgb(239, 68, 68)" : "var(--background)",
                  color: action === "unpublish" ? "white" : "var(--foreground)",
                  border: `2px solid ${
                    action === "unpublish" ? "rgb(239, 68, 68)" : "var(--border)"
                  }`,
                }}
              >
                ❌ Unpublish
              </button>
              {entityType === "section" && (
                <>
                  <button
                    onClick={() => setAction("publish-with-items")}
                    className="px-4 py-2 rounded font-semibold transition-all"
                    style={{
                      backgroundColor:
                        action === "publish-with-items"
                          ? "rgb(34, 197, 94)"
                          : "var(--background)",
                      color: action === "publish-with-items" ? "white" : "var(--foreground)",
                      border: `2px solid ${
                        action === "publish-with-items" ? "rgb(34, 197, 94)" : "var(--border)"
                      }`,
                    }}
                  >
                    ✅ Publish + Items
                  </button>
                  <button
                    onClick={() => setAction("unpublish-with-items")}
                    className="px-4 py-2 rounded font-semibold transition-all"
                    style={{
                      backgroundColor:
                        action === "unpublish-with-items"
                          ? "rgb(239, 68, 68)"
                          : "var(--background)",
                      color: action === "unpublish-with-items" ? "white" : "var(--foreground)",
                      border: `2px solid ${
                        action === "unpublish-with-items" ? "rgb(239, 68, 68)" : "var(--border)"
                      }`,
                    }}
                  >
                    ❌ Unpublish + Items
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Execute Button */}
          <button
            onClick={executeAction}
            disabled={loading || !adminToken.trim() || !entityId.trim()}
            className="w-full px-6 py-3 rounded text-white font-bold transition-all hover:scale-105 disabled:opacity-50"
            style={{ backgroundColor: "var(--color-coral)" }}
          >
            {loading ? "⏳ Executing..." : `🚀 Execute ${action}`}
          </button>
        </div>

        {/* Result */}
        {result && (
          <div
            className="p-6 rounded-lg border-2"
            style={{
              backgroundColor: result.ok
                ? "rgba(34, 197, 94, 0.1)"
                : "rgba(239, 68, 68, 0.1)",
              borderColor: result.ok ? "rgb(34, 197, 94)" : "rgb(239, 68, 68)",
            }}
          >
            <h2
              className="text-2xl font-bold mb-4"
              style={{ fontFamily: "Fjalla One" }}
            >
              {result.ok ? "✅ Success" : "❌ Error"}
            </h2>

            {result.ok && result.data && (
              <div className="space-y-2">
                <p className="font-semibold">
                  Action: {result.data.action.replace(/_/g, " ")}
                </p>
                {result.data.pageId && <p>Page ID: {result.data.pageId}</p>}
                {result.data.sectionId && <p>Section ID: {result.data.sectionId}</p>}
                {result.data.itemId && <p>Item ID: {result.data.itemId}</p>}
              </div>
            )}

            {!result.ok && result.error && (
              <div className="space-y-2">
                <p className="font-semibold">Error Code: {result.error.code}</p>
                <p>{result.error.message}</p>
              </div>
            )}

            <details className="mt-4">
              <summary className="cursor-pointer font-semibold">
                📋 Raw Response
              </summary>
              <pre
                className="mt-2 p-4 rounded overflow-auto text-xs"
                style={{ backgroundColor: "var(--background)" }}
              >
                {JSON.stringify(result, null, 2)}
              </pre>
            </details>
          </div>
        )}

        {/* API Reference */}
        <div
          className="mt-6 p-6 rounded-lg"
          style={{ backgroundColor: "var(--color-bg-light)" }}
        >
          <h2 className="text-xl font-bold mb-3" style={{ fontFamily: "Fjalla One" }}>
            📚 API Reference
          </h2>
          <div className="space-y-2 text-sm font-mono">
            <p><strong>Pages:</strong></p>
            <ul className="ml-4 space-y-1">
              <li>POST /api/admin/pages/:id/publish</li>
              <li>POST /api/admin/pages/:id/unpublish</li>
            </ul>
            <p className="mt-3"><strong>Sections:</strong></p>
            <ul className="ml-4 space-y-1">
              <li>POST /api/admin/sections/:id/publish</li>
              <li>POST /api/admin/sections/:id/unpublish</li>
              <li>POST /api/admin/sections/:id/publish-with-items</li>
              <li>POST /api/admin/sections/:id/unpublish-with-items</li>
            </ul>
            <p className="mt-3"><strong>Items:</strong></p>
            <ul className="ml-4 space-y-1">
              <li>POST /api/admin/items/:id/publish</li>
              <li>POST /api/admin/items/:id/unpublish</li>
            </ul>
          </div>
          <div className="mt-4 p-4 rounded" style={{ backgroundColor: "var(--background)" }}>
            <p className="font-semibold mb-2">Required Headers:</p>
            <code>X-Admin-Token: &lt;token&gt;</code>
          </div>
        </div>

        {/* Quick Links */}
        <div
          className="mt-6 p-6 rounded-lg"
          style={{ backgroundColor: "var(--color-bg-light)" }}
        >
          <h2 className="text-xl font-bold mb-3" style={{ fontFamily: "Fjalla One" }}>
            🔗 Quick Links
          </h2>
          <div className="grid gap-2">
            <a
              href="/sys-mgmt-xK9/page-resolve-live-test"
              className="px-4 py-2 rounded text-center font-semibold transition-all hover:scale-105"
              style={{
                backgroundColor: "var(--color-coral)",
                color: "white",
              }}
            >
              🧪 Page Resolve Live Test
            </a>
            <a
              href="/sys-mgmt-xK9/login"
              className="px-4 py-2 rounded text-center font-semibold transition-all hover:scale-105"
              style={{
                backgroundColor: "var(--color-bg-light)",
                border: "2px solid var(--border)",
              }}
            >
              🔐 Admin Login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
