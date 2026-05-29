import { FormField, TemplateDefinition } from "./FormBuilderPage";

export type DocumentData = Record<string, string>;
type Approver = { name: string; title: string; order: number };

function ApprovalTable({ approvers, writer }: { approvers: Approver[]; writer: string }) {
  const cols = [{ name: writer, title: "기안자", order: 0 }, ...approvers];
  return (
    <div className="flex flex-col items-end shrink-0">
      <p className="text-xs text-gray-400 mb-1">결재</p>
      <div className="border border-gray-400 overflow-hidden" style={{ minWidth: 160 }}>
        <div className="flex">
          {cols.map((col) => (
            <div key={col.order} className="flex-1 border-r border-gray-400 last:border-r-0 text-center py-1 px-2 bg-gray-50">
              <p className="text-xs text-gray-600" style={{ fontWeight: 600 }}>
                {col.order === 0 ? "기안자" : `${col.order}차 결재`}
              </p>
            </div>
          ))}
        </div>
        <div className="flex" style={{ minHeight: 40 }}>
          {cols.map((col) => (
            <div key={col.order} className="flex-1 border-r border-gray-400 last:border-r-0 bg-white flex items-center justify-center py-2 px-1">
              <div className="text-center">
                <p className="text-xs text-gray-800" style={{ fontWeight: 600 }}>{col.name}</p>
                <p className="text-xs text-gray-500">{col.title}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DocHeader({
  formType, approvers, writer, dept, date, docNo,
}: {
  formType: string; approvers: Approver[]; writer: string; dept: string; date: string; docNo: string;
}) {
  return (
    <div className="border border-gray-300 overflow-hidden rounded-sm mb-5">
      <div className="flex items-start justify-between px-6 py-4 border-b border-gray-300 bg-white gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded bg-blue-700 flex items-center justify-center shrink-0">
            <span className="text-white text-xs" style={{ fontWeight: 700, letterSpacing: "0.05em" }}>CORP</span>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">전자결재 시스템</p>
            <h3 className="text-gray-900" style={{ fontWeight: 700, letterSpacing: "0.03em" }}>{formType}</h3>
          </div>
        </div>
        <ApprovalTable approvers={approvers} writer={writer} />
      </div>
      <div className="grid grid-cols-4 border-b border-gray-300 text-xs">
        {[
          { label: "작 성 일", value: date },
          { label: "부 서 명", value: dept },
          { label: "기 안 자", value: writer },
          { label: "문서 번호", value: docNo },
        ].map((item, i) => (
          <div key={i} className={`flex ${i < 3 ? "border-r border-gray-300" : ""}`}>
            <div className="bg-gray-50 border-r border-gray-300 px-2 py-1.5 shrink-0 flex items-center text-gray-600" style={{ fontWeight: 600, minWidth: 60 }}>{item.label}</div>
            <div className="flex-1 px-2 py-1.5 bg-white text-gray-800 flex items-center">{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function RichEditorPanel({
  templateSchema,
  documentData,
  onChange,
  approvers,
  writer = "박도윤",
  dept = "IT 기획팀",
  date = "2026-05-05",
  docNo = "자동 부여",
  readonly = false,
}: {
  templateSchema: TemplateDefinition;
  documentData: DocumentData;
  onChange: (key: string, val: string) => void;
  approvers: Approver[];
  writer?: string;
  dept?: string;
  date?: string;
  docNo?: string;
  readonly?: boolean;
}) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
      <div className="px-3 py-1.5 bg-blue-600 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex gap-1"><div className="w-2.5 h-2.5 rounded-full bg-red-400" /><div className="w-2.5 h-2.5 rounded-full bg-yellow-400" /><div className="w-2.5 h-2.5 rounded-full bg-green-400" /></div>
          <span className="text-xs text-blue-100">{readonly ? "문서 뷰어" : "문서 편집기 (Form Engine)"}</span>
        </div>
      </div>

      <div className="p-5" style={{ background: "#fafafa" }}>
        <DocHeader formType={templateSchema.name} approvers={approvers} writer={writer} dept={dept} date={date} docNo={docNo} />

        <div className="bg-white border border-gray-200 rounded-sm px-6 py-6 shadow-sm">
           <DynamicFormRenderer fields={templateSchema.fields} data={documentData} onChange={onChange} readonly={readonly} />
        </div>

        <div className="flex justify-end mt-6">
          <div className="text-right space-y-1">
            <p className="text-xs text-gray-400">위와 같이 결재를 요청합니다.</p>
            <p className="text-xs text-gray-500">{date}</p>
            <p className="text-sm text-gray-700" style={{ fontWeight: 600 }}>{dept} {writer} 올림</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function DynamicFormRenderer({
  fields, data, onChange, readonly,
}: {
  fields: FormField[]; data: DocumentData; onChange: (key: string, val: string) => void; readonly?: boolean;
}) {
  return (
    <div className="space-y-6 text-sm">
      {fields.map((field) => (
        <section key={field.id} className="space-y-2.5">
          <div className="bg-gray-100 border-l-4 border-blue-600 px-3 py-1.5 flex items-center gap-2">
            <p className="text-xs text-gray-700" style={{ fontWeight: 600 }}>{field.label}</p>
            {field.required && !readonly && <span className="text-red-500 text-xs">*</span>}
          </div>
          
          <div className="px-1">
            {field.type === "text" && (
              readonly ? <div className="border border-gray-200 rounded px-3 py-2 bg-gray-50 text-sm text-gray-800 min-h-[38px] flex items-center">{data[field.key] || <span className="text-gray-400 italic">미입력</span>}</div>
              : <input type="text" value={data[field.key] || ""} onChange={(e) => onChange(field.key, e.target.value)} placeholder={field.placeholder || `${field.label} 입력`} className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all bg-white" />
            )}

            {field.type === "number" && (
              readonly ? <div className="border border-gray-200 rounded px-3 py-2 bg-gray-50 text-sm text-gray-800 min-h-[38px] flex items-center">{data[field.key] ? Number(data[field.key].replace(/,/g, "")).toLocaleString() : <span className="text-gray-400 italic">0</span>} {field.placeholder || "원"}</div>
              : <div className="flex items-center gap-2"><input type="text" value={data[field.key] || ""} onChange={(e) => { const val = e.target.value.replace(/[^0-9]/g, ""); onChange(field.key, val ? Number(val).toLocaleString() : ""); }} placeholder="0" className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all bg-white text-right" />{field.placeholder && <span className="text-sm text-gray-600 shrink-0">{field.placeholder}</span>}</div>
            )}

            {field.type === "date" && (
              readonly ? <div className="border border-gray-200 rounded px-3 py-2 bg-gray-50 text-sm text-gray-800 min-h-[38px] flex items-center">{data[field.key] || <span className="text-gray-400 italic">미입력</span>}</div>
              : <input type="date" value={data[field.key] || ""} onChange={(e) => onChange(field.key, e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all bg-white" />
            )}

            {field.type === "longtext" && (
              readonly ? <div className="border border-gray-200 rounded px-3 py-2 bg-gray-50 text-sm text-gray-800 min-h-[80px] whitespace-pre-wrap leading-relaxed">{data[field.key] || <span className="text-gray-400 italic">미입력</span>}</div>
              : <textarea value={data[field.key] || ""} onChange={(e) => onChange(field.key, e.target.value)} rows={field.rows ?? 4} placeholder={field.placeholder || "내용을 상세히 입력하세요"} className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-800 resize-none focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all bg-white leading-relaxed" />
            )}

            {field.type === "select" && (
              readonly ? <div className="border border-gray-200 rounded px-3 py-2 bg-gray-50 text-sm text-gray-800 min-h-[38px] flex items-center">{data[field.key] || <span className="text-gray-400 italic">미입력</span>}</div>
              : <select value={data[field.key] || ""} onChange={(e) => onChange(field.key, e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all bg-white"><option value="" disabled>선택하세요</option>{(field.options ?? []).map((opt) => (<option key={opt} value={opt}>{opt}</option>))}</select>
            )}

            {field.type === "table" && (
              <div className="border border-gray-300 rounded overflow-hidden">
                <div className="grid bg-gray-50 border-b border-gray-300" style={{ gridTemplateColumns: `repeat(${field.cols?.length ?? 2}, 1fr)` }}>
                  {(field.cols ?? ["항목", "값"]).map((col, i, arr) => (
                    <div key={i} className={`px-2 py-2 text-xs text-gray-700 font-bold text-center ${i < arr.length - 1 ? 'border-r border-gray-300' : ''}`}>{col.trim() || `열 ${i+1}`}</div>
                  ))}
                </div>
                {Array.from({ length: field.rows ?? 2 }).map((_, rIdx) => (
                  <div key={rIdx} className={`grid ${rIdx < (field.rows ?? 2) - 1 ? "border-b border-gray-200" : ""}`} style={{ gridTemplateColumns: `repeat(${field.cols?.length ?? 2}, 1fr)` }}>
                    {(field.cols ?? ["항목", "값"]).map((col, cIdx, arr) => {
                      const cellKey = `${field.key}_${rIdx}_${cIdx}`;
                      return (
                        <div key={cIdx} className={`${cIdx < arr.length - 1 ? 'border-r border-gray-200' : ''}`}>
                          {readonly ? <div className="px-2 py-2 text-xs text-gray-800 min-h-[36px] bg-white flex items-center justify-center text-center break-all">{data[cellKey] || "—"}</div>
                          : <input type="text" value={data[cellKey] || ""} onChange={(e) => onChange(cellKey, e.target.value)} className="w-full px-2 py-2 text-xs text-gray-800 focus:outline-none bg-transparent text-center hover:bg-gray-50 focus:bg-blue-50 transition-colors" placeholder="입력" />}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      ))}
    </div>
  );
}

// 💡 템플릿의 필수 제약조건을 동적으로 검증
export function isDocumentDataFilled(templateSchema: TemplateDefinition, data: DocumentData): boolean {
  return templateSchema.fields.every((field) => {
    if (!field.required) return true;
    if (field.type === "table") {
      const rows = field.rows ?? 2;
      const colsCount = field.cols?.length ?? 2;
      let hasValue = false;
      for(let r=0; r<rows; r++) {
        for(let c=0; c<colsCount; c++) {
          if ((data[`${field.key}_${r}_${c}`] || "").trim().length > 0) hasValue = true;
        }
      }
      return hasValue;
    }
    return (data[field.key] || "").trim().length > 0;
  });
}

// 💡 동적 HTML 스냅샷 생성 & E5 보안 검증 통합
export function buildContentSnapshot(templateSchema: TemplateDefinition, data: DocumentData): string {
  let bodyHtml = `<div class="dynamic-format">`;
  
  templateSchema.fields.forEach(field => {
    bodyHtml += `<h3>${field.label}</h3>`;
    if (field.type === 'table') {
      bodyHtml += `<table border="1"><tr>`;
      (field.cols ?? []).forEach(c => bodyHtml += `<th>${c}</th>`);
      bodyHtml += `</tr>`;
      for(let r=0; r<(field.rows??2); r++){
        bodyHtml += `<tr>`;
        for(let c=0; c<(field.cols?.length??2); c++){
          bodyHtml += `<td>${data[`${field.key}_${r}_${c}`] || ''}</td>`;
        }
        bodyHtml += `</tr>`;
      }
      bodyHtml += `</table>`;
    } else {
      bodyHtml += `<p>${data[field.key] || "미입력"}</p>`;
    }
  });
  bodyHtml += `</div>`;
  
  const finalHtml = `<html><body><h1>${templateSchema.name}</h1>${bodyHtml}</body></html>`;

  // [E5] 악성 콘텐츠(XSS) 포함 검증 로직 시뮬레이션
  const xssPattern = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>|javascript:|onerror=/gi;
  if (xssPattern.test(finalHtml)) {
    throw new Error("INVALID_SECURITY_CONTENT");
  }

  return finalHtml;
}