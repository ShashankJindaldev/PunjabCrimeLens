import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000',
  timeout: 30000,
})

export const isCancel = axios.isCancel

/** Turns any axios/FastAPI error into a readable string. */
export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (error?.code === 'ERR_NETWORK') {
    return `Cannot reach the API at ${api.defaults.baseURL}. Is the FastAPI server running?`
  }
  const detail = error?.response?.data?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail) && detail.length) {
    return detail.map((d) => d?.msg).filter(Boolean).join('; ') || fallback
  }
  return error?.message || fallback
}

/** POST /api/upload: multipart CSV upload with progress callback (0-100). */
export async function uploadCsv(file, onProgress) {
  const form = new FormData()
  form.append('file', file)
  const { data } = await api.post('/api/upload', form, {
    timeout: 120000,
    onUploadProgress: (event) => {
      if (event.total && onProgress) {
        onProgress(Math.round((event.loaded * 100) / event.total))
      }
    },
  })
  return data
}

/** GET /api/summary */
export async function getSummary(signal) {
  const { data } = await api.get('/api/summary', { signal })
  return data
}

/** GET /api/risk-assessment */
export async function getRiskAssessment(signal) {
  const { data } = await api.get('/api/risk-assessment', { signal })
  return data
}

/** GET /api/forecast?district=&years= */
export async function getForecast(district, years, signal) {
  const { data } = await api.get('/api/forecast', {
    params: { district, years },
    signal,
  })
  return data
}

/** GET /api/export/report/{district}: Downloads the PDF intelligence brief */
/** GET /api/export/report/{district}: Downloads the PDF intelligence brief */
export async function exportIntelligenceReport(district, years) {
  const response = await api.get(`/api/export/report/${encodeURIComponent(district)}`, {
    params: { years },
    responseType: 'blob', 
  });
  
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${district.toLowerCase().replace(/\s+/g, '_')}_intelligence_report.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

/** GET /api/categories?district=... */
export async function getCategories(district, signal) {
  const { data } = await api.get('/api/categories', {
    params: { district },
    signal,
  })
  return data
}

/** POST /api/reset: Clears the backend memory */
export async function resetData() {
  const { data } = await api.post('/api/reset');
  return data;
}

export default api
