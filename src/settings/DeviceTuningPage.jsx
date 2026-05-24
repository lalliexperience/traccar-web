import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  FormControl,
  MenuItem,
  Select,
  Typography,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import PageLayout from '../common/components/PageLayout';
import SettingsMenu from './components/SettingsMenu';
import { useTranslation } from '../common/components/LocalizationProvider';
import { useCatchCallback } from '../reactHelper';
import useSettingsStyles from './common/useSettingsStyles';
import relayFetch from '../common/util/relayApi';
import relayCommandCatalog from './relayCommandCatalog';

const statusColor = (status) => {
  if (status === 'online') return 'success';
  if (status === 'offline') return 'default';
  return 'warning';
};

const DeviceTuningPage = () => {
  const t = useTranslation();
  const { classes } = useSettingsStyles();
  const [devices, setDevices] = useState([]);
  const [deviceId, setDeviceId] = useState('');
  const [selectedCommands, setSelectedCommands] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const response = await relayFetch('/devices');
        const list = await response.json();
        setDevices(list);
      } catch (e) {
        setError(e.message || String(e));
      }
    })();
  }, []);

  const selectedDevice = devices.find((d) => String(d.id) === String(deviceId));

  const handleQueue = useCatchCallback(async () => {
    if (!deviceId || selectedCommands.length === 0) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const response = await relayFetch('/queue', {
        method: 'POST',
        body: JSON.stringify({
          deviceId: Number(deviceId),
          commands: selectedCommands,
        }),
      });
      setResult(await response.json());
      const refresh = await relayFetch('/devices');
      setDevices(await refresh.json());
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setBusy(false);
    }
  }, [deviceId, selectedCommands]);

  return (
    <PageLayout menu={<SettingsMenu />} breadcrumbs={['settingsTitle', 'relayDeviceTuning']}>
      <Container maxWidth="sm" className={classes.container}>
        <Typography variant="h6" gutterBottom>
          {t('relayDeviceTuning')}
        </Typography>

        <FormControl fullWidth margin="normal">
          <InputLabel>{t('relaySelectDevice')}</InputLabel>
          <Select
            value={deviceId}
            label={t('relaySelectDevice')}
            onChange={(e) => setDeviceId(e.target.value)}
          >
            {devices.map((device) => (
              <MenuItem key={device.id} value={device.id}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                  <span>{device.name}</span>
                  <Typography variant="caption" color="text.secondary">
                    {device.uniqueId}
                  </Typography>
                  <Chip
                    size="small"
                    label={device.status}
                    color={statusColor(device.status)}
                    sx={{ ml: 'auto' }}
                  />
                  {device.queueDepth > 0 && (
                    <Chip size="small" label={`Q:${device.queueDepth}`} color="info" />
                  )}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {selectedDevice && !selectedDevice.hologramDeviceId && (
          <Alert severity="warning" sx={{ my: 1 }}>
            {t('relayHologramAttributeHint')}
          </Alert>
        )}

        <Box component="label" sx={{ display: 'block', mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            {t('relayCommandOptions')}
          </Typography>
          <Box
            component="select"
            multiple
            value={selectedCommands}
            onChange={(e) => {
              const values = Array.from(e.target.selectedOptions, (o) => o.value);
              setSelectedCommands(values);
            }}
            sx={{
              width: '100%',
              minHeight: 220,
              fontFamily: 'inherit',
              fontSize: '0.875rem',
            }}
          >
            {relayCommandCatalog.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </Box>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
            {t('relayMultiSelectHint')}
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>}
        {result && (
          <Alert severity="success" sx={{ my: 2 }}>
            {result.channel === 'sms'
              ? t('relayQueuedSms', { count: result.sent })
              : t('relayQueuedTcp', { count: result.queued })}
          </Alert>
        )}

        <Button
          variant="contained"
          color="primary"
          startIcon={<SendIcon />}
          disabled={busy || !deviceId || selectedCommands.length === 0}
          onClick={handleQueue}
          sx={{ mt: 2 }}
        >
          {t('relayQueueSettings')}
        </Button>
      </Container>
    </PageLayout>
  );
};

export default DeviceTuningPage;
