import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Container,
  LinearProgress,
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
  const [imei, setImei] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleInitialize = useCatchCallback(async () => {
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
        <TextField
          fullWidth
          margin="normal"
          label={t('relayDeviceImei')}
          value={imei}
          onChange={(e) => setImei(e.target.value)}
        />
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
          disabled={busy || !imei.trim() || !adminPhone.trim()}
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
