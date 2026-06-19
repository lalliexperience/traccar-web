const relayCommandCatalog = [
  {
    label: 'Hardware Relay Control',
    options: [
      { label: 'Cut Fuel (555)', value: '555' },
      { label: 'Restore Fuel (666)', value: '666' },
    ],
  },
  {
    label: 'Smart Cornering Overrides',
    options: [
      { label: 'Angle Override ON 30°', value: 'angle123456 30' },
      { label: 'Angle OFF', value: 'angle123456 off' },
      { label: 'Distance ON 100m', value: 'distance123456 100' },
      { label: 'Distance OFF', value: 'distance123456 off' },
    ],
  },
  {
    label: 'Security Flag Alarms',
    options: [
      { label: 'Vibration ON', value: 'vibrate123456' },
      { label: 'Vibration OFF', value: 'novibrate123456' },
      { label: 'Ignition Alarm ON', value: 'acc123456' },
      { label: 'Ignition Alarm OFF', value: 'noacc123456' },
      { label: 'Main Power Snip Alarm ON', value: 'pwr123456' },
      { label: 'Main Power Snip OFF', value: 'nopwr123456' },
    ],
  },
  {
    label: 'Battery Optimization',
    options: [
      { label: 'Shock Vibration Sleep', value: 'sleep123456 shock' },
      { label: 'Timer Sleep', value: 'sleep123456 time' },
      { label: 'Sleep Disabled', value: 'sleep123456 off' },
    ],
  },
];

export default relayCommandCatalog;
