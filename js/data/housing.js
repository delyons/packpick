/* Housing communities, villages, 2026-27 projected rates, and the question tree for the housing quiz. */
import { money } from '../format.js';

const HOUSE_BUDGET = { id: 'hb', type: 'budget', q: 'Do you have a housing budget?', sub: 'An exact or rough amount is fine. NC State bills housing per semester, and the prices here include the $150 ResNet fee. Skip it if you have not set one.', min: 2500, max: 7000, step: 50, def: 4500, unit: 'per semester' };

/* ================= Housing data ================= */
const V = {
  eng: { name: 'Engineering Village', who: 'First-year students in the College of Engineering or its associated programs.', does: 'Explore engineering pathways and majors through the NAE Grand Challenges, hands-on makerspace learning, and academic and wellness support.', home: 'Wolf Ridge is listed as home to Engineering Village.' },
  centennial: { name: 'Centennial Engineering Village', who: 'Second-year and transfer engineering students. Sophomores who completed Engineering Village qualify, and so do new transfer engineering students.', does: 'Major-specific professional experiences, upper-level coursework support and student wellness.' },
  expl: { name: 'Exploratory Studies Village', who: 'First-year students in the Exploratory Studies Program (undecided majors).', does: 'Explore majors, careers and interests through guided inquiry that lines up with academic advising.' },
  honors: { name: 'Honors Village', who: 'First-year, returning and transfer students accepted to the University Honors Program.', does: 'Intellectual exploration, the Metaskills Challenge and an interdisciplinary event series with faculty speakers.' },
  say: { name: 'SAY Village', who: 'First-year students. SAY stands for Students Advocating for Youth.', does: 'Real youth advocacy with local youth, through coursework and one-on-one mentoring.' },
  wise: { name: 'WISE Village', who: 'Female-identifying students in STEM majors. First-year, returning and transfer students in STEM colleges can join. WISE stands for Women in Science and Engineering.', does: 'Personalized peer support, academic and professional development, and community building.' },
  albright: { name: 'Albright Entrepreneurs Village', who: 'Returning and transfer students.', does: 'Turn ideas into action through entrepreneurship coursework, innovation trips and access to the entrepreneurship ecosystem.', home: 'Wolf Ridge is listed as home to Albright Entrepreneurs Village.' },
  arts: { name: 'Arts Village', who: 'Creative students in any major. First-year, returning and transfer students can join.', does: 'Creative expression through performances, exhibitions and interdisciplinary collaboration.' },
  eco: { name: 'EcoVillage', who: 'Sustainability-minded students. First-year, returning and transfer students can join.', does: 'Environmental stewardship and hands-on co-curricular experiences with campus partners.' },
  global: { name: 'Global Village', who: 'Internationally minded students. First-year, returning, transfer and exchange students can join.', does: 'Live in a global community, with cultural programming that celebrates diverse backgrounds.' },
  thrive: { name: 'THRIVE Village', who: 'First-year students who want support with the transition to NC State.', does: 'Learn the six dimensions of wellness through community service, skill-building and connections to campus resources.' },
  transfer: { name: 'Transfer Connections Village', who: 'New and returning transfer students.', does: 'Peer mentorship, goal-setting support and guided introductions to campus opportunities.', home: 'Wolf Village is listed as home to Transfer Connections Village.' },
  bmi: { name: 'Black Male Initiative Village', who: 'Male students of color.', does: 'Four themes: aspirational, navigational, social and cultural, including professional development and civil rights history.', unconfirmed: true },
  native: { name: 'Native Space', who: 'Native American students.', does: 'Self-advocacy, networking with Native organizations and giving back to the community.', unconfirmed: true },
  welch: { name: 'Women of Welch', who: 'Students committed to social justice.', does: 'Workshops and service that address systemic oppression and activism.', unconfirmed: true }
};
const VILLAGE_NOTES = [
  'Villages have their own application. Submit it together with your housing application, and apply as early as you can.',
  'NC State\'s housing site also mentions Impact Leadership Village and Wellness Village. I could not find details on either, so check with University Housing.'
];
const UNCONFIRMED = 'NC State\'s current village page does not list eligibility for this village. The description comes from a 2022 NC State article, so confirm with University Housing before you plan around it.';

const H = {};
Object.keys(V).forEach(k => {
  const v = V[k];
  H[k] = { name: v.name, line: 'A living and learning village.', facts: [['Who it is for', v.who], ['What you will do', v.does]].concat(v.home ? [['Where', v.home]] : []), warn: v.unconfirmed ? UNCONFIRMED : '', notes: VILLAGE_NOTES };
});
H.general = { name: 'General housing application', line: 'No village. You apply through the main University Housing application.', facts: [
  ['How you are placed', 'Assignments are randomized across the housing communities open to new students.'],
  ['Roommates', 'Your application includes a roommate matching profile. Roommates are matched on questionnaire answers and within a one-year age range, and new first-years are usually paired with other first-years.'],
  ['Where you could land', 'Traditional residence halls such as Turlington and Alexander, or the inner four buildings of Wolf Village Apartments.']
], notes: ['New first-years live on campus for their first two semesters, with a few exceptions.', 'There is no fee to apply for housing.', 'Single rooms for first-years are typically given only with a medical need approved by the Disability Resource Office.'] };
H.hall = { name: 'Residence hall', line: 'Traditional hall-style living, with other students on your floor.', facts: [
  ['Options', 'NC State lists 23 undergraduate halls, including Alexander, Bagwell, Becton, Berry, Bowen, Bragaw, Carroll, Gold, Lee, Metcalf, North, Owen, Sullivan, Syme, Tucker, Turlington, Watauga, Welch and Wood, plus University Towers.'],
  ['Layouts', 'Hall, suite and hotel configurations, depending on the building.'],
  ['Singles', 'Several halls, including Watauga, Wood and Avent Ferry, offer single rooms.']
], notes: ['Space is limited for upper-class students because of the first-year live-on requirement.', 'Returning residents choose rooms through the room selection process during the academic year.'] };
H.wolfvillage = { name: 'Wolf Village Apartments', line: 'Furnished four-bedroom apartments with your own bedroom.', facts: [
  ['Layout', 'Four-bedroom apartments with single-occupancy rooms, plus studios for one person.'],
  ['Furnished', 'Each bedroom has a bed, desk, chair, dresser, bookshelf and closet. The shared living room and kitchen come with appliances, furniture and a stackable washer and dryer in every apartment.'],
  ['Getting around', 'On the Wolfline bus system.'],
  ['Extras', 'Indoor fitness area, on-site convenience store, volleyball courts, study lounges and computer labs.'],
  ['Community', 'Home to Transfer Connections Village.']
], notes: ['Wolf Village is also open to some first-years, in the inner four buildings.'] };
H.wolfridge = { name: 'Wolf Ridge Apartments', line: 'Furnished apartments on Centennial Campus.', facts: [
  ['Who can live there', 'Upper-class and graduate students.'],
  ['Layouts', 'Graduate lofts, and two, three and four-bedroom apartments.'],
  ['Furnished', 'Each bedroom has a full-size bed, desk, chair, lamp and wardrobe. Shared spaces include kitchen appliances, a sectional sofa and an entertainment center.'],
  ['Location', 'Centennial Campus, directly across from the James B. Hunt Library. It is a LEED Silver-certified community.'],
  ['Extras', 'Fitness center, dining hall, bookstore, beach volleyball court and laundry.'],
  ['Community', 'Home to Albright Entrepreneurs Village and Engineering Village.']
], notes: [] };
H.esking = { name: 'E.S. King Village Apartments', line: 'Studios and one or two-bedroom apartments, furnished or unfurnished.', facts: [
  ['Who can live there', 'Sophomores, juniors, seniors, graduate students, postdocs and students with families. Undergraduates need at least 12 credit hours.'],
  ['Layouts', 'Studios, one-bedrooms (Buildings A, B, C, D, H and O are reserved for undergraduates in double occupancy) and two-bedrooms.'],
  ['Furnished', 'Furnished and unfurnished options.'],
  ['Extras', 'Fitness room, volleyball, basketball and tennis courts, two laundry facilities and high-speed internet.'],
  ['Parking', 'On-site, with a permit.']
], notes: ['Maximum two residents in a one-bedroom and four in a two-bedroom. Spouses and legal dependents need prior approval.'] };
H.westernmanor = { name: 'Western Manor Apartments', line: 'Unfurnished apartments with a private patio or balcony and utilities included.', facts: [
  ['Who can live there', 'Mainly faculty, staff, students with families and postdocs. The primary resident must be full-time, which is at least 12 credit hours for undergraduates.'],
  ['Layouts', 'Studios, one-bedrooms and two-bedrooms, all unfurnished.'],
  ['Costs', 'Utilities are included in rent. Internet costs extra.'],
  ['Location', 'Convenient to Main and Centennial campuses, with nearby bus routes.'],
  ['Extras', 'Laundry in Building N, a gazebo and grills, and a quiet study space.']
], notes: ['Maximum two residents in a studio or one-bedroom and four in a two-bedroom. Spouses and legal dependents need prior approval.'] };
H.apartment = { name: 'An apartment or studio near campus', line: 'Private housing close to NC State.', facts: [
  ['Places to start', 'University Towers, Valentine Commons, Friendly Apartments, Stanhope Apartments and Live On Hillsborough.'],
  ['What to know', 'These are private companies and not NC State housing. NC State does not endorse them.']
], notes: ['Read any lease carefully before you sign. NC State Student Legal Services can help.', 'The Commuter 900 meal plan is open to off-campus students.'] };
H.athome = { name: 'At home, commuting', line: 'Live at home and commute to campus.', facts: [
  ['Why it works', 'You keep home costs and skip a housing application.'],
  ['Meals', 'The Commuter 900 meal plan gives you 900 Dining Dollars a semester for $900 plus tax, with no dining hall meals.']
], notes: ['Plan your commute for class times, labs and late study sessions before you commit.'] };

/* 2026-27 projected per-semester rates from University Housing. Villages live in several buildings, so they get a range. */
const RESNET = 150;
const COST = {
  general: [3970, 4780], hall: [3970, 4600], wolfvillage: [4780, 5375], wolfridge: [4780, 5375],
  esking: [4150, 5300], westernmanor: [4150, 5300], athome: [0, 0]
};
Object.keys(V).forEach(k => { COST[k] = [3970, 4780]; });
['eng', 'albright', 'transfer'].forEach(k => { COST[k] = [4780, 5375]; });
function costOf(key) { const c = COST[key]; if (!c) return null; const fee = key === 'athome' ? 0 : RESNET; return [c[0] + fee, c[1] + fee]; }
const range = c => c[0] === c[1] ? money(c[0]) : money(c[0]) + ' to ' + money(c[1]);

/* ---- Housing question tree ---- */
const r = (label, sub, result) => ({ label, sub, result });
const n = (label, sub, next) => ({ label, sub, next });
const N_FY_MAJOR = { q: 'Which one fits you best?', opts: [
  r('Engineering', '', 'eng'),
  r('Another STEM major, and I am female-identifying', '', 'wise'),
  r('Education or working with youth', '', 'say'),
  r('Undecided on a major', '', 'expl'),
  r('University Honors Program', '', 'honors')
]};
const N_FY_INT = { q: 'Which sounds most like you?', opts: [
  r('Creative and artistic', 'Performing, making, showing work.', 'arts'),
  r('Sustainability and the environment', '', 'eco'),
  r('A global, international community', '', 'global'),
  r('Social justice and activism', '', 'welch')
]};
const N_FY_COMM = { q: 'What do you want from your community?', opts: [
  r('A community for male students of color', '', 'bmi'),
  r('A community for Native American students', '', 'native'),
  r('Support getting started at NC State', 'Open to any first-year student.', 'thrive')
]};
const N_FY_THEME = { q: 'What do you want your village built around?', opts: [
  n('My major or field', '', N_FY_MAJOR),
  n('An interest I care about', '', N_FY_INT),
  n('Community and support', '', N_FY_COMM)
]};
const N_FY = { q: 'Do you want to live in a living and learning village?', sub: 'Villages group students by a shared theme, with their own programs.', opts: [
  n('Yes', 'Narrow it down to one village.', N_FY_THEME),
  r('No', 'Use the general housing application.', 'general')
]};
const N_VIL_A = { q: 'Which one fits you best?', opts: [
  r('University Honors Program', '', 'honors'),
  r('A STEM major, and I am female-identifying', '', 'wise'),
  r('Engineering, second-year or transfer', '', 'centennial'),
  r('Starting a business or building ideas', 'Returning or transfer students.', 'albright')
]};
const N_VIL_I = { q: 'Which sounds most like you?', opts: [
  r('Creative and artistic', '', 'arts'),
  r('Sustainability and the environment', '', 'eco'),
  r('A global, international community', '', 'global'),
  r('Social justice and activism', '', 'welch')
]};
const N_VIL_C = { q: 'What do you want from your community?', opts: [
  r('A community for male students of color', '', 'bmi'),
  r('A community for Native American students', '', 'native'),
  r('Support and peers as a transfer student', '', 'transfer')
]};
const N_VIL = { q: 'What do you want your village built around?', opts: [
  n('Academics and career', '', N_VIL_A),
  n('Interests', '', N_VIL_I),
  n('Community and identity', '', N_VIL_C)
]};
const N_APT_A = { q: 'What matters most in your apartment?', opts: [
  r('Furnished, with my own bedroom in a shared four-bedroom', 'Roommates, with a store and volleyball on site.', 'wolfvillage'),
  r('Centennial Campus, across from the Hunt Library', 'Furnished, with a dining hall and bookstore nearby.', 'wolfridge'),
  r('Small layouts and the choice of furnished or unfurnished', 'Studios, one-bedrooms and two-bedrooms.', 'esking'),
  r('Unfurnished, with a balcony and utilities included', '', 'westernmanor')
]};
const N_APT_B = { q: 'What do you need for your household?', opts: [
  r('Unfurnished, with utilities included and a private patio', '', 'westernmanor'),
  r('The choice of furnished or unfurnished', 'Plus courts, a fitness room and a playground.', 'esking')
]};
const N_APT = { q: 'Who is moving in?', opts: [
  n('Just me', '', N_APT_A),
  n('Me and roommates', '', N_APT_A),
  n('Me and a spouse or dependents', '', N_APT_B)
]};
const mkOn = lead => ({ lead, q: 'What kind of home do you want on campus?', opts: [
  r('A room in a residence hall', '', 'hall'),
  n('An apartment of my own', '', N_APT),
  n('A living and learning village', '', N_VIL)
]});
const N_ON = mkOn('');
const N_ON_NS = mkOn('Your answers point to on campus.');
const mkOff = lead => ({ lead, q: 'Is your family home close enough to commute?', opts: [
  r('Yes, and I am happy to commute', '', 'athome'),
  r('Yes, but I would rather live near campus', '', 'apartment'),
  r('No', '', 'apartment')
]});
const N_OFF = mkOff('');
const N_OFF_NS = mkOff('Your answers point to off campus.');
const decide = chosen => chosen.reduce((s, o) => s + (o.w || 0), 0) >= 0 ? N_ON_NS : N_OFF_NS;
const ns = (label, sub, w, next) => ({ label, sub, w, next });
const N_NS3 = { q: 'How do you feel about a lease and paying your own utilities?', opts: [
  Object.assign(ns('Fine with it', 'I want to run my own place.', -1, decide), { cand: [N_ON_NS, N_OFF_NS] }),
  Object.assign(ns('I would rather not', 'Keep it simple.', 1, decide), { cand: [N_ON_NS, N_OFF_NS] })
]};
const N_NS2 = { q: 'What sounds better?', opts: [
  ns('A furnished place that is set up for me', '', 1, N_NS3),
  ns('Choosing my own layout and landlord', '', -1, N_NS3)
]};
const N_NS1 = { q: 'How much do you want to walk to class and campus events?', opts: [
  ns('As much as possible', '', 1, N_NS2),
  ns('It does not matter much', '', -1, N_NS2)
]};
const ROOT_H = { q: 'Where are you in your NC State journey?', opts: [
  n('First-year', 'You live on campus for your first two semesters.', N_FY),
  n('Returning student', 'Living on campus after year one is optional.', {
    q: 'Where do you want to live?', opts: [
      n('On campus', '', N_ON),
      n('Off campus', '', N_OFF),
      n('Not sure yet', 'Answer a few questions to narrow it down.', N_NS1)
    ]})
]};
const RETURNING_ROOT = ROOT_H.opts[1].next;
const depthMemo = new Map();
function depth(node) {
  if (depthMemo.has(node)) return depthMemo.get(node);
  let best = 0;
  node.opts.forEach(o => {
    if (o.result) return;
    const nexts = o.cand || [o.next];
    nexts.forEach(x => { best = Math.max(best, depth(x)); });
  });
  depthMemo.set(node, 1 + best);
  return 1 + best;
}

export { HOUSE_BUDGET, V, H, COST, costOf, range, ROOT_H, N_FY, RETURNING_ROOT, depth };
