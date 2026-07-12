import { Request, Response } from 'express';
import * as reportService from './report.service';

export async function getReport(req: Request, res: Response) {
  const reportType = req.params.reportType;
  if (!reportService.isReportType(reportType)) {
    return res.status(400).json({ success: false, error: 'Unknown report type' });
  }
  try {
    res.json({ success: true, data: await reportService.getReportData(reportType) });
  } catch (error) {
    sendError(res, error);
  }
}

export async function exportReport(req: Request, res: Response) {
  const reportType = req.params.reportType;
  const format = req.query.format;
  if (!reportService.isReportType(reportType)) {
    return res.status(400).json({ success: false, error: 'Unknown report type' });
  }
  if (format !== 'csv' && format !== 'json') {
    return res.status(400).json({ success: false, error: 'format must be csv or json' });
  }
  try {
    const file = await reportService.exportReport(reportType, format);
    res.setHeader('Content-Type', file.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
    res.send(file.content);
  } catch (error) {
    sendError(res, error);
  }
}

function sendError(res: Response, error: unknown) {
  const err = error as Error & { statusCode?: number };
  res.status(err.statusCode ?? 500).json({ success: false, error: err.message || 'Internal server error' });
}
