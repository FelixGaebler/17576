import { submitAcronym } from '../../lib/scoring'
import { getDb } from './db'

const db = getDb()

const users = {
  felix: { externalId: 'dev-user', displayName: 'Felix Weber', email: 'felix.weber@example.com' },
  anna: { externalId: 'seed-anna', displayName: 'Anna Schmidt', email: 'anna.schmidt@example.com' },
  max: { externalId: 'seed-max', displayName: 'Max Müller', email: 'max.mueller@example.com' },
  lena: { externalId: 'seed-lena', displayName: 'Lena Fischer', email: 'lena.fischer@example.com' },
  jonas: { externalId: 'seed-jonas', displayName: 'Jonas Becker', email: 'jonas.becker@example.com' },
  sophie: { externalId: 'seed-sophie', displayName: 'Sophie Wagner', email: 'sophie.wagner@example.com' },
  paul: { externalId: 'seed-paul', displayName: 'Paul Hoffmann', email: 'paul.hoffmann@example.com' },
  mia: { externalId: 'seed-mia', displayName: 'Mia Schulz', email: 'mia.schulz@example.com' },
  leon: { externalId: 'seed-leon', displayName: 'Leon Koch', email: 'leon.koch@example.com' },
  clara: { externalId: 'seed-clara', displayName: 'Clara Richter', email: 'clara.richter@example.com' },
}

type UserKey = keyof typeof users

// [user, acronym, meaning, days ago]. Replayed oldest first through the real
// scoring logic, so scores and transaction types are always consistent.
const submissions: [UserKey, string, string, number][] = [
  ['max', 'POS', 'Point of Sale', 29],
  ['anna', 'API', 'Application Programming Interface', 28],
  ['anna', 'KPI', 'Key Performance Indicator', 28],
  ['lena', 'UAT', 'User Acceptance Testing', 28],
  ['anna', 'ABC', 'Application Business Controller', 27],
  ['felix', 'SOP', 'Standard Operating Procedure', 27],
  ['jonas', 'IAM', 'Identity Access Management', 27],
  ['anna', 'ERP', 'Enterprise Resource Planning', 26],
  ['max', 'VPN', 'Virtual Private Network', 26],
  ['sophie', 'HRM', 'Human Resource Management', 26],
  ['anna', 'CRM', 'Customer Relationship Management', 25],
  ['felix', 'KPI', 'Key Performance Indicator', 25],
  ['paul', 'WMS', 'Warehouse Management System', 25],
  ['anna', 'SLA', 'Service Level Agreement', 24],
  ['lena', 'DOD', 'Definition of Done', 24],
  ['mia', 'APM', 'Application Performance Monitoring', 24],
  ['max', 'DNS', 'Domain Name System', 23],
  ['jonas', 'BCP', 'Business Continuity Plan', 23],
  ['anna', 'CRS', 'Customer Reservation System', 22],
  ['sophie', 'FTE', 'Full Time Equivalent', 22],
  ['leon', 'QAS', 'Quality Assurance System', 22],
  ['felix', 'DMS', 'Document Management System', 21],
  ['lena', 'PRD', 'Product Requirements Document', 21],
  ['paul', 'BOM', 'Bill of Materials', 21],
  ['anna', 'MVP', 'Minimum Viable Product', 20],
  ['max', 'CDN', 'Content Delivery Network', 20],
  ['mia', 'CAB', 'Change Advisory Board', 20],
  ['felix', 'CSR', 'Corporate Social Responsibility', 19],
  ['jonas', 'DRP', 'Disaster Recovery Plan', 19],
  ['clara', 'FAQ', 'Frequently Asked Questions', 19],
  ['anna', 'SSO', 'Single Sign On', 18],
  ['lena', 'URL', 'Uniform Resource Locator', 18],
  ['sophie', 'LMS', 'Learning Management System', 18],
  ['max', 'ABC', 'Activity Based Costing', 17],
  ['paul', 'JIT', 'Just in Time', 17],
  ['felix', 'EMP', 'Employee Master Profile', 16],
  ['jonas', 'RCA', 'Root Cause Analysis', 16],
  ['leon', 'RFP', 'Request for Proposal', 16],
  ['anna', 'RFC', 'Request for Comments', 15],
  ['lena', 'CMS', 'Content Management System', 15],
  ['mia', 'PMO', 'Project Management Office', 15],
  ['max', 'MVP', 'Most Valuable Player', 14],
  ['sophie', 'NDA', 'Non Disclosure Agreement', 14],
  ['felix', 'WIP', 'Work in Progress', 13],
  ['jonas', 'ITS', 'Internal Ticket System', 13],
  ['paul', 'OTD', 'On Time Delivery', 13],
  ['anna', 'OPS', 'Order Processing Service', 12],
  ['lena', 'SEO', 'Search Engine Optimization', 12],
  ['leon', 'IPO', 'Initial Public Offering', 12],
  ['max', 'ETL', 'Extract Transform Load', 11],
  ['sophie', 'EOD', 'End of Day', 11],
  ['mia', 'TBD', 'To Be Decided', 11],
  ['felix', 'API', 'Application Programming Interface', 10],
  ['jonas', 'EMP', 'Enterprise Messaging Platform', 10],
  ['clara', 'SEO', 'search engine optimization', 10],
  ['anna', 'PIM', 'Product Information Management', 9],
  ['lena', 'CSR', 'Customer Service Representative', 9],
  ['paul', 'OPS', 'Operations Planning System', 9],
  ['felix', 'FAQ', 'Frequently Asked Questions', 8],
  ['sophie', 'ROI', 'Return on Investment', 8],
  ['leon', 'API', 'Application Programming Interface', 8],
  ['max', 'CRS', 'Central Reporting Service', 7],
  ['jonas', 'POS', 'Purchase Order System', 7],
  ['mia', 'MRR', 'Monthly Recurring Revenue', 7],
  ['anna', 'QBR', 'Quarterly Business Review', 6],
  ['lena', 'KPI', 'Key Performance Indicator', 6],
  ['paul', 'ERP', 'Enterprise Resource Planning', 6],
  ['felix', 'PTO', 'Paid Time Off', 5],
  ['sophie', 'DOD', 'Department of Defense', 5],
  ['leon', 'VPN', 'Virtual Private Network', 5],
  ['max', 'SLA', 'Service Level Agreement', 4],
  ['jonas', 'SSO', 'Single Sign On', 4],
  ['mia', 'ITS', 'Intelligent Transport System', 4],
  ['anna', 'ZDD', 'Zero Downtime Deployment', 3],
  ['felix', 'POS', 'Point of Sale', 3],
  ['paul', 'TTM', 'Time to Market', 3],
  ['clara', 'BCP', 'Business Continuity Plan', 3],
  ['anna', 'NPS', 'Net Promoter Score', 2],
  ['lena', 'GTM', 'Go to Market', 2],
  ['sophie', 'CRM', 'Customer Relationship Management', 2],
  ['felix', 'AOF', 'Apple Often Fails', 1],
  ['jonas', 'RFC', 'Request for Change', 1],
  ['mia', 'PIM', 'Personal Information Manager', 1],
  ['felix', 'ABC', 'Automated Booking Component', 0],
]

function submissionTime(daysAgo: number, index: number) {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  // Spread submissions over the working day, keeping them in list order and in the past.
  date.setHours(8, 0, 0, 0)
  date.setMinutes(index * 7)
  return new Date(Math.min(date.getTime(), Date.now() - (submissions.length - index) * 60_000))
}

async function resetGlossary() {
  await db.orm.public.ScoreTransaction.where((t) => t.id.gt(0)).deleteAndCount()
  await db.orm.public.Meaning.where((m) => m.id.gt(0)).deleteAndCount()
  await db.orm.public.Acronym.where((a) => a.id.gt(0)).deleteAndCount()
  await db.orm.public.User.where((u) => u.id.gt(0)).deleteAndCount()
}

async function main() {
  await resetGlossary()

  const userIds = {} as Record<UserKey, number>
  for (const [key, user] of Object.entries(users) as [UserKey, (typeof users)[UserKey]][]) {
    userIds[key] = (await db.orm.public.User.create(user)).id
  }

  const outcomes: Record<string, number> = {}
  for (const [index, [user, acronym, meaning, daysAgo]] of submissions.entries()) {
    const result = await submitAcronym(
      userIds[user],
      { acronym, meaning },
      submissionTime(daysAgo, index),
    )
    outcomes[result.outcome] = (outcomes[result.outcome] ?? 0) + 1
  }

  console.log(`Seeded ${Object.keys(users).length} users and ${submissions.length} submissions.`, outcomes)
}

main()
  .then(() => db.close())
  .catch(async (error) => {
    console.error(error)
    await db.close()
    process.exit(1)
  })
