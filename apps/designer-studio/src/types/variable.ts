export type VariableCategory = 'COUPLE' | 'EVENT' | 'VENUE' | 'FAMILY' | 'RSVP' | 'CUSTOM';
export type VariableDataType = 'text' | 'date' | 'time' | 'phone' | 'email' | 'number';

export interface InvitationVariable {
  id: string;
  key: string;              // e.g. "bride_name"
  label: string;            // e.g. "Bride Name"
  category: VariableCategory;
  value: string;            // e.g. "Priya"
  defaultValue: string;     // e.g. "Bride Name"
  dataType: VariableDataType;
  required: boolean;
  isCustom?: boolean;
}

export const INITIAL_VARIABLES: InvitationVariable[] = [
  // COUPLE
  { id: 'v-bride', key: 'bride_name', label: 'Bride Name', category: 'COUPLE', value: 'Priya', defaultValue: 'Bride Name', dataType: 'text', required: true },
  { id: 'v-groom', key: 'groom_name', label: 'Groom Name', category: 'COUPLE', value: 'Rahul', defaultValue: 'Groom Name', dataType: 'text', required: true },

  // EVENT
  { id: 'v-wdate', key: 'wedding_date', label: 'Wedding Date', category: 'EVENT', value: '24 October 2026', defaultValue: '24 Oct 2026', dataType: 'date', required: true },
  { id: 'v-wtime', key: 'wedding_time', label: 'Muhurtham Time', category: 'EVENT', value: '7:30 PM', defaultValue: '7:30 PM', dataType: 'time', required: true },
  { id: 'v-rtime', key: 'reception_time', label: 'Reception Time', category: 'EVENT', value: '6:30 PM Onwards', defaultValue: '6:30 PM Onwards', dataType: 'time', required: false },
  { id: 'v-ename', key: 'event_name', label: 'Event Name', category: 'EVENT', value: 'Wedding Ceremony', defaultValue: 'Wedding Ceremony', dataType: 'text', required: false },

  // VENUE
  { id: 'v-vname', key: 'venue_name', label: 'Venue Name', category: 'VENUE', value: 'Sri Convention Hall', defaultValue: 'Venue Name', dataType: 'text', required: true },
  { id: 'v-vaddr', key: 'venue_address', label: 'Venue Address', category: 'VENUE', value: 'MG Road, Bengaluru', defaultValue: 'Venue Address', dataType: 'text', required: false },

  // FAMILY
  { id: 'v-bfather', key: 'bride_father', label: "Bride's Father", category: 'FAMILY', value: 'Sri K. Sharma', defaultValue: "Bride's Father", dataType: 'text', required: false },
  { id: 'v-bmother', key: 'bride_mother', label: "Bride's Mother", category: 'FAMILY', value: 'Smt. Sunita Sharma', defaultValue: "Bride's Mother", dataType: 'text', required: false },
  { id: 'v-gfather', key: 'groom_father', label: "Groom's Father", category: 'FAMILY', value: 'Sri R. Verma', defaultValue: "Groom's Father", dataType: 'text', required: false },
  { id: 'v-gmother', key: 'groom_mother', label: "Groom's Mother", category: 'FAMILY', value: 'Smt. Rekha Verma', defaultValue: "Groom's Mother", dataType: 'text', required: false },
  { id: 'v-host', key: 'host_family', label: 'Host Family Line', category: 'FAMILY', value: 'Smt. Sunita & Sri K. Sharma', defaultValue: 'Host Family', dataType: 'text', required: false },

  // RSVP
  { id: 'v-rphone', key: 'rsvp_phone', label: 'RSVP Contact Phone', category: 'RSVP', value: '+91 98765 43210', defaultValue: '+91 XXXXX XXXXX', dataType: 'phone', required: false },
  { id: 'v-remail', key: 'rsvp_email', label: 'RSVP Contact Email', category: 'RSVP', value: 'rsvp@rootedmemoirs.com', defaultValue: 'rsvp@example.com', dataType: 'email', required: false },

  // CUSTOM INITIAL
  { id: 'v-deity', key: 'blessing_deity', label: 'Deity Blessing Line', category: 'CUSTOM', value: '॥ श्री गणेशाय नमः ॥', defaultValue: 'Deity Blessing', dataType: 'text', required: false, isCustom: true },
];
