import type { QueueItem } from "../types";

export const initialQueueItems: QueueItem[] = [
  {
    id: 'OIL-2026-X882',
    eventId: 'EV-8492A',
    status: 'review',
    statusLabel: 'Review',
    activityPhrase: 'alignment and grouting',
    activityDescription: 'Welding joint inspection at Sector 4B',
    discipline: 'Piping',
    inputFormat: 'dpr',
    timestamp: 'Oct 24, 09:15 AM',
    date: '2026-10-24',
    confidenceScore: 78,
    tagId: 'Pump P-1102',
    priority: 'High',
    contractor: 'Bridge & Roof Co. India',
    exceptionNote: 'Minor delay due to heavy monsoonal rain at Sector 4B.',
    actualStart: '2026-10-24',
    actualFinish: '2026-10-28',
    progress: 85,
    sourceText: 'Pump P-1102 alignment and grouting completed by evening shift. Area cleared.',
    formatTabs: {
      dprText: 'Pump P-1102 alignment and grouting completed by evening shift. Area cleared.',
      spreadsheet: 'Row 142: TAG=P-1102 | DISCIPLINE=PIPING | STATUS=COMPLETED | ACT_START=21/08/2026 08:00 | PROG=85%',
      scanUrl: 'DPR_Scan_Sector4B_20261024.pdf',
      voiceTranscription: 'Shift supervisor note: Pump P-1102 alignment done. Ready for final bolting and grout pouring tomorrow morning. Crane required for casing placement.'
    },
    extractedFields: [
      { fieldName: 'Activity Phrase', extractedValue: 'alignment and grouting', systemMapping: '-' },
      { fieldName: 'Discipline', extractedValue: 'Piping', systemMapping: 'Piping' },
      { fieldName: 'Tag ID', extractedValue: 'Pump P-1102', systemMapping: 'P-1102', hasWarning: true },
      { fieldName: 'Status', extractedValue: 'completed', systemMapping: 'In progress', statusBadge: 'In progress' },
      { fieldName: 'Actual Start', extractedValue: 'evening shift', systemMapping: '21 Aug 2026 08:00' },
      { fieldName: 'Progress', extractedValue: '-', systemMapping: '85%', progressPercent: 85 }
    ],
    candidates: [
      {
        id: 'L6-PIP-4092',
        wbsPath: '01.05.03 | Piping Main Header | Numaligarh',
        discipline: 'Piping',
        title: 'Install Piping Main Header Segment B',
        plannedStart: '2023-11-15',
        plannedFinish: '2023-11-28',
        durationDays: 14,
        responsibility: 'Team Alpha - Mech Div',
        resources: ['Crane 50T (1)', 'Welding Rigs (4)', 'Fitters (8)'],
        matchScore: 0.78,
        isRecommended: true,
        rationale: 'High textual similarity on "alignment" and "grouting". Tag P-1102 partially matches expected equipment list for area.'
      },
      {
        id: 'L6-PIP-4093',
        wbsPath: '01.05.03 | Piping Main Header | Numaligarh',
        discipline: 'Piping',
        title: 'Weld Piping Main Header Segment B Joints',
        plannedStart: '2023-11-29',
        plannedFinish: '2023-12-05',
        durationDays: 7,
        responsibility: 'Team Alpha - Welding Crew 2',
        resources: ['Welding Rigs (6)', 'Inspectors (2)'],
        matchScore: 0.62,
        isRecommended: false,
        rationale: 'Secondary match for joint welding phase.'
      },
      {
        id: 'L6-PIP-4088',
        wbsPath: '01.05.03 | Piping Main Header | Numaligarh',
        discipline: 'Piping',
        title: 'Pressure Test Main Header Segment A',
        plannedStart: '2023-12-06',
        plannedFinish: '2023-12-10',
        durationDays: 5,
        responsibility: 'Hydrotest Team 1',
        resources: ['Hydrotest Pump (2)', 'Calibrated Gauges (4)'],
        matchScore: 0.45,
        isRecommended: false,
        rationale: 'Downstream testing activity.'
      }
    ]
  },
  {
    id: 'EV-8491C',
    eventId: 'EV-8491C',
    status: 'auto_approved',
    statusLabel: 'Auto-Approved',
    activityPhrase: 'Material tally count verification',
    activityDescription: 'Material tally count verification',
    discipline: 'Civil',
    inputFormat: 'spreadsheet',
    timestamp: 'Oct 24, 08:30 AM',
    date: '2026-10-24',
    confidenceScore: 95,
    tagId: 'MAT-CIV-884',
    priority: 'Medium',
    contractor: 'Larsen & Toubro Civil Works',
    exceptionNote: '',
    actualStart: '2026-10-24',
    actualFinish: '2026-10-24',
    progress: 100,
    sourceText: 'Batch 44 cement and rebar delivery verified against bill of quantities. Storage depot 3 inspected.',
    formatTabs: {
      dprText: 'Batch 44 cement and rebar delivery verified against bill of quantities.',
      spreadsheet: 'PO-99182 | CEMENT_PORTLAND_43 | 500 TONS | ACCEPTED | DEPOT_3',
      scanUrl: 'Delivery_Challan_884.pdf'
    },
    extractedFields: [
      { fieldName: 'Activity Phrase', extractedValue: 'tally count verification', systemMapping: 'Material Receipt' },
      { fieldName: 'Discipline', extractedValue: 'Civil', systemMapping: 'Civil' },
      { fieldName: 'Tag ID', extractedValue: 'MAT-CIV-884', systemMapping: 'MAT-CIV-884' },
      { fieldName: 'Status', extractedValue: 'completed', systemMapping: 'Completed', statusBadge: 'Completed' },
      { fieldName: 'Progress', extractedValue: '100%', systemMapping: '100%', progressPercent: 100 }
    ],
    candidates: [
      {
        id: 'L5-CIV-2019',
        wbsPath: '01.02.01 | Foundation & Civil | Duliajan',
        discipline: 'Civil',
        title: 'Material Receipt & Verification - Foundation Works',
        plannedStart: '2023-11-10',
        plannedFinish: '2023-11-12',
        durationDays: 2,
        responsibility: 'Civil Materials Store',
        resources: ['Forklift (2)', 'Store Keepers (3)'],
        matchScore: 0.95,
        isRecommended: true,
        rationale: 'Exact match with procurement schedule item.'
      }
    ]
  },
  {
    id: 'ACT-9821-B',
    eventId: 'EV-8490F',
    status: 'flagged',
    statusLabel: 'Flagged',
    activityPhrase: 'Anomaly detected in pressure readings',
    activityDescription: 'Anomaly detected in pressure readings',
    discipline: 'Instrumentation',
    inputFormat: 'voice',
    timestamp: 'Oct 23, 16:45 PM',
    date: '2026-10-23',
    confidenceScore: 62,
    tagId: 'PT-4409-X',
    priority: 'High',
    contractor: 'Schlumberger Asia Services',
    exceptionNote: 'Sensor mismatch with manual gauge log during routine cementing.',
    actualStart: '2026-10-23',
    actualFinish: '',
    progress: 30,
    sourceText: 'Casing pressure anomaly detected during routine cementing operation at Rig 44. Sensor mismatch with manual log.',
    formatTabs: {
      voiceTranscription: 'Alert from Rig 44 supervisor: Pressure transmitter PT-4409 spiked to 420 PSI during cementing, manual analog gauge showed 280 PSI. Operation halted for calibration check.',
      dprText: 'Casing pressure anomaly detected during routine cementing operation at Rig 44. Sensor mismatch with manual log.'
    },
    extractedFields: [
      { fieldName: 'Activity Phrase', extractedValue: 'casing pressure anomaly', systemMapping: 'Pressure Verification' },
      { fieldName: 'Discipline', extractedValue: 'Instrumentation', systemMapping: 'Instrumentation' },
      { fieldName: 'Tag ID', extractedValue: 'PT-4409-X', systemMapping: 'PT-4409-X', hasWarning: true },
      { fieldName: 'Status', extractedValue: 'halted', systemMapping: 'Flagged', statusBadge: 'Flagged' },
      { fieldName: 'Progress', extractedValue: '30%', systemMapping: '30%', progressPercent: 30 }
    ],
    candidates: [
      {
        id: 'L6-INS-9811',
        wbsPath: '02.04.11 | Wellhead Instrumentation | Rig 44',
        discipline: 'Instrumentation',
        title: 'Calibrate Wellhead Pressure Transmitters',
        plannedStart: '2023-11-20',
        plannedFinish: '2023-11-22',
        durationDays: 2,
        responsibility: 'Instrumentation Maintenance Crew B',
        resources: ['Fluke Calibrator (2)', 'Instrument Techs (2)'],
        matchScore: 0.65,
        isRecommended: true,
        rationale: 'Matches flagged calibration protocol for anomalous sensors.'
      }
    ]
  },
  {
    id: 'PRD-4410-X',
    eventId: 'EV-8489A',
    status: 'review',
    statusLabel: 'Review',
    activityPhrase: 'Daily trenching progress report scan',
    activityDescription: 'Daily trenching progress report scan',
    discipline: 'Civil',
    inputFormat: 'scan',
    timestamp: 'Oct 23, 14:10 PM',
    date: '2026-10-23',
    confidenceScore: 82,
    tagId: 'TR-SEC-4',
    priority: 'Medium',
    contractor: 'Assam Civil Infrastructure Ltd.',
    exceptionNote: 'Requires splitting into granular shift-wise records for compliance.',
    actualStart: '2026-10-23',
    actualFinish: '2026-10-27',
    progress: 60,
    sourceText: 'Daily production volume report spans multiple shifts. Requires splitting into granular shift-wise records for compliance. Excavation reached chainage 4+200.',
    formatTabs: {
      scanUrl: 'Trenching_Report_Chainage_4200.pdf',
      dprText: 'Daily production volume report spans multiple shifts. Requires splitting into granular shift-wise records for compliance.'
    },
    extractedFields: [
      { fieldName: 'Activity Phrase', extractedValue: 'trenching progress', systemMapping: 'Excavation' },
      { fieldName: 'Discipline', extractedValue: 'Civil', systemMapping: 'Civil' },
      { fieldName: 'Tag ID', extractedValue: 'TR-SEC-4', systemMapping: 'TR-SEC-4' },
      { fieldName: 'Status', extractedValue: 'in_progress', systemMapping: 'In progress', statusBadge: 'In progress' },
      { fieldName: 'Progress', extractedValue: '60%', systemMapping: '60%', progressPercent: 60 }
    ],
    candidates: [
      {
        id: 'L6-CIV-3301',
        wbsPath: '01.03.02 | Pipeline Trenching | Sector 4',
        discipline: 'Civil',
        title: 'Trenching & Bedding Chainage 4+000 to 5+000',
        plannedStart: '2023-11-18',
        plannedFinish: '2023-11-26',
        durationDays: 8,
        responsibility: 'Civil Earthworks Div',
        resources: ['Excavator 20T (3)', 'Dumpers (6)', 'Survey Crew (1)'],
        matchScore: 0.84,
        isRecommended: true,
        rationale: 'Spatial chainage 4+200 directly intersects active WBS node 01.03.02.'
      }
    ]
  },
  {
    id: 'EV-8488B',
    eventId: 'EV-8488B',
    status: 'in_progress',
    statusLabel: 'In Progress',
    activityPhrase: 'Drafting field notes: Substation cabling',
    activityDescription: 'Drafting field notes: Substation cabling',
    discipline: 'Electrical',
    inputFormat: 'dpr',
    timestamp: 'Oct 23, 11:05 AM',
    date: '2026-10-23',
    confidenceScore: 88,
    tagId: 'SUB-CBL-11KV',
    priority: 'Low',
    contractor: 'BHEL Electrical Installations',
    exceptionNote: '',
    actualStart: '2026-10-22',
    actualFinish: '2026-10-30',
    progress: 45,
    sourceText: 'Drafting field notes: 11kV HT cable pulling along duct bank C. Termination kits delivered at site.',
    formatTabs: {
      dprText: 'Drafting field notes: 11kV HT cable pulling along duct bank C. Termination kits delivered at site.'
    },
    extractedFields: [
      { fieldName: 'Activity Phrase', extractedValue: 'Substation cabling', systemMapping: 'Cable Laying' },
      { fieldName: 'Discipline', extractedValue: 'Electrical', systemMapping: 'Electrical' },
      { fieldName: 'Tag ID', extractedValue: 'SUB-CBL-11KV', systemMapping: 'SUB-CBL-11KV' },
      { fieldName: 'Status', extractedValue: 'in_progress', systemMapping: 'In progress', statusBadge: 'In progress' },
      { fieldName: 'Progress', extractedValue: '45%', systemMapping: '45%', progressPercent: 45 }
    ],
    candidates: [
      {
        id: 'L6-ELE-1044',
        wbsPath: '01.08.02 | 11kV Substation Cabling | Substation 2',
        discipline: 'Electrical',
        title: 'Pull & Terminate 11kV Cables - Duct Bank C',
        plannedStart: '2023-11-12',
        plannedFinish: '2023-11-20',
        durationDays: 8,
        responsibility: 'Electrical Power Division',
        resources: ['Cable Puller Winch (1)', 'Electricians (6)'],
        matchScore: 0.89,
        isRecommended: true,
        rationale: 'Tag and specification alignment for Substation 2.'
      }
    ]
  },
  {
    id: 'EXP-1102-Y',
    eventId: 'EXP-1102-Y',
    status: 'pending',
    statusLabel: 'Pending',
    activityPhrase: 'Seismic survey data packet received for Block 9',
    activityDescription: 'Seismic survey data packet received for Block 9. Awaiting supervisor approval...',
    discipline: 'Exploration',
    inputFormat: 'telemetry',
    timestamp: 'Yesterday, 16:30',
    date: '2026-10-23',
    confidenceScore: 91,
    tagId: 'GEO-BLK-9',
    priority: 'Medium',
    contractor: 'WesternGeco Seismic Crew',
    exceptionNote: 'Awaiting supervisor approval to integrate into master database.',
    actualStart: '2026-10-23',
    actualFinish: '2026-10-23',
    progress: 100,
    sourceText: 'Seismic survey data packet received for Block 9. Awaiting supervisor approval to integrate into master database.',
    formatTabs: {
      dprText: 'Seismic survey data packet received for Block 9. 2D lines processed: 140 LKM.'
    },
    extractedFields: [
      { fieldName: 'Activity Phrase', extractedValue: 'Seismic survey data', systemMapping: 'Geophysical Acquisition' },
      { fieldName: 'Discipline', extractedValue: 'Exploration', systemMapping: 'Exploration' },
      { fieldName: 'Tag ID', extractedValue: 'GEO-BLK-9', systemMapping: 'GEO-BLK-9' },
      { fieldName: 'Status', extractedValue: 'pending', systemMapping: 'Pending', statusBadge: 'Pending' }
    ],
    candidates: [
      {
        id: 'L5-EXP-5501',
        wbsPath: '03.01.04 | 2D Seismic Exploration | Block 9',
        discipline: 'Exploration',
        title: '2D Seismic Data Acquisition & Processing',
        plannedStart: '2023-11-01',
        plannedFinish: '2023-11-30',
        durationDays: 30,
        responsibility: 'Geophysics Dept',
        resources: ['Seismic Recording Truck (2)', 'Geophysicists (4)'],
        matchScore: 0.92,
        isRecommended: true,
        rationale: 'Block 9 acquisition matches active exploration campaign.'
      }
    ]
  },
  {
    id: 'DRL-8822-C',
    eventId: 'DRL-8822-C',
    status: 'review',
    statusLabel: 'Review',
    activityPhrase: 'Mud log entries combined for depth intervals 4000m-4200m',
    activityDescription: 'Mud log entries combined for depth intervals 4000m-4200m. System requests discrete logs.',
    discipline: 'Drilling',
    inputFormat: 'dpr',
    timestamp: 'Yesterday, 14:15',
    date: '2026-10-23',
    confidenceScore: 74,
    tagId: 'RIG-08-ML',
    priority: 'High',
    contractor: 'Halliburton Mud Logging',
    exceptionNote: 'System requests discrete logs every 50m instead of grouped 200m bundle.',
    actualStart: '2026-10-22',
    actualFinish: '2026-10-24',
    progress: 70,
    sourceText: 'Mud log entries combined for depth intervals 4000m-4200m. System requests discrete logs every 50m.',
    formatTabs: {
      dprText: 'Mud log entries combined for depth intervals 4000m-4200m. Hydrocarbon shows detected at 4110m.'
    },
    extractedFields: [
      { fieldName: 'Activity Phrase', extractedValue: 'Mud logging 4000m-4200m', systemMapping: 'Drilling Mud Logging' },
      { fieldName: 'Discipline', extractedValue: 'Drilling', systemMapping: 'Drilling' },
      { fieldName: 'Tag ID', extractedValue: 'RIG-08-ML', systemMapping: 'RIG-08-ML' },
      { fieldName: 'Status', extractedValue: 'review', systemMapping: 'Needs Review', statusBadge: 'Review' }
    ],
    candidates: [
      {
        id: 'L6-DRL-8800',
        wbsPath: '02.01.06 | Deep Well Drilling | Well NH-08',
        discipline: 'Drilling',
        title: 'Intermediate Section Mud Logging 3800m - 4300m',
        plannedStart: '2023-11-14',
        plannedFinish: '2023-11-24',
        durationDays: 10,
        responsibility: 'Drilling Operation Crew 1',
        resources: ['Mud Logging Unit (1)', 'Drilling Engineers (2)'],
        matchScore: 0.81,
        isRecommended: true,
        rationale: 'Interval overlaps 4000-4200m intermediate hole section.'
      }
    ]
  },
  {
    id: 'HSE-9001-A',
    eventId: 'HSE-9001-A',
    status: 'flagged',
    statusLabel: 'Flagged',
    activityPhrase: 'Safety incident report submitted without required photo',
    activityDescription: 'Safety incident report submitted without required photographic evidence and supervisor counter-signature.',
    discipline: 'Compliance',
    inputFormat: 'mobile',
    timestamp: 'Yesterday, 09:00',
    date: '2026-10-23',
    confidenceScore: 50,
    tagId: 'HSE-INC-09',
    priority: 'High',
    contractor: 'Apex Safety Services',
    exceptionNote: 'Missing supervisor signature and photo attachment.',
    actualStart: '2026-10-23',
    actualFinish: '2026-10-23',
    progress: 20,
    sourceText: 'Safety incident report submitted without required photographic evidence and supervisor counter-signature. Minor slip incident reported at GGS-2.',
    formatTabs: {
      dprText: 'Safety incident report submitted without required photographic evidence and supervisor counter-signature.'
    },
    extractedFields: [
      { fieldName: 'Activity Phrase', extractedValue: 'Safety incident near-miss', systemMapping: 'HSE Audit' },
      { fieldName: 'Discipline', extractedValue: 'Compliance', systemMapping: 'Compliance' },
      { fieldName: 'Tag ID', extractedValue: 'HSE-INC-09', systemMapping: 'HSE-INC-09', hasWarning: true },
      { fieldName: 'Status', extractedValue: 'flagged', systemMapping: 'Flagged', statusBadge: 'Flagged' }
    ],
    candidates: [
      {
        id: 'L5-HSE-1104',
        wbsPath: '00.04.01 | Safety & Environmental Audits | GGS-2',
        discipline: 'Compliance',
        title: 'Monthly Safety Compliance Audit & Incident Resolution',
        plannedStart: '2023-11-01',
        plannedFinish: '2023-11-30',
        durationDays: 30,
        responsibility: 'HSE Officer Team',
        resources: ['Safety Auditors (2)'],
        matchScore: 0.72,
        isRecommended: true,
        rationale: 'Mandatory resolution entry under HSE compliance schedule.'
      }
    ]
  }
];
