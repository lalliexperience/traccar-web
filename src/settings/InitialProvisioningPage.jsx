import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import PageLayout from '../common/components/PageLayout';
import SettingsMenu from './components/SettingsMenu';
import { useTranslation } from '../common/components/LocalizationProvider';
import { useCatchCallback } from '../reactHelper';
import useSettingsStyles from './common/useSettingsStyles';
import relayFetch from '../common/util/relayApi';

const InitialProvisioningPage = () => {
  const t = useTranslation();
  const { classes } = useSettingsStyles();
  const [devices, setDevices] = useState([]);
  const [deviceId, setDeviceId] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const response = await relayFetch('/devices');
        setDevices(await response.json());
      } catch (e) {
        setError(e.message || String(e));
      }
    })();
  }, []);

  const selectedDevice = devices.find((d) => String(d.id) === String(deviceId));
  const imei = selectedDevice?.uniqueId ?? '';

  const handleInitialize = useCatchCallback(async () => {
    if (!imei || !adminPhone.trim()) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const response = await relayFetch('/provision/initialize', {
        method: 'POST',
        body: JSON.stringify({ imei: imei.trim(), adminPhone: adminPhone.trim() }),
      });
      setResult(await response.json());
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setBusy(false);
    }
  }, [imei, adminPhone]);

  return (
    <PageLayout menu={<SettingsMenu />} breadcrumbs={['settingsTitle', 'relayInitialProvisioning']}>
      <Container maxWidth="sm" className={classes.container}>
        <Typography variant="h6" gutterBottom>
          {t('relayInitialProvisioning')}
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          {t('relayInitialProvisioningHint')}
        </Typography>
        <Alert severity="info" sx={{ mb: 2 }}>
          {t('relayHologramAttributeHint')}
        </Alert>

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
                  {!device.hologramDeviceId && (
                    <Chip size="small" label={t('relayNoHologramId')} color="warning" />
                  )}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {selectedDevice && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {t('relayProvisionImei')}: <strong>{selectedDevice.uniqueId}</strong>
          </Typography>
        )}

        {selectedDevice && !selectedDevice.hologramDeviceId && (
          <Alert severity="warning" sx={{ mb: 1 }}>
            {t('relayHologramAttributeHint')}
          </Alert>
        )}

        <TextField
          fullWidth
          margin="normal"
          label={t('relayAdminPhone')}
          value={adminPhone}
          onChange={(e) => setAdminPhone(e.target.value)}
          placeholder="+15551234567"
        />
        {busy && <LinearProgress sx={{ my: 2 }} />}
        {error && (
          <Alert severity="error" sx={{ my: 2 }}>
            {error}
          </Alert>
        )}
        {result && (
          <Box sx={{ my: 2 }}>
            <Alert severity="success">
              {t('relayProvisionSuccess')}
            </Alert>
            <Typography variant="caption" component="pre" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
              {JSON.stringify(result, null, 2)}
            </Typography>
          </Box>
        )}
        <Button
          variant="contained"
          color="primary"
          disabled={
            busy
            || !deviceId
            || !adminPhone.trim()
            || !selectedDevice?.hologramDeviceId
          }
          onClick={handleInitialize}
          startIcon={<SettingsIcon />}
          sx={{ mt: 2 }}
        >
          {t('relayInitializeUnit')}
        </Button>
      </Container>
    </PageLayout>
  );
};

export default InitialProvisioningPage;
