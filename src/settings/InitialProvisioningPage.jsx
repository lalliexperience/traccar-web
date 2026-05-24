import { useEffect, useMemo, useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  Container,
  FormControl,
  InputLabel,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
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
  const [uploadOnSec, setUploadOnSec] = useState(20);
  const [uploadOffSec, setUploadOffSec] = useState(300);
  const [previewSteps, setPreviewSteps] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [devicesRes, defaultsRes] = await Promise.all([
          relayFetch('/devices'),
          relayFetch('/provision/defaults'),
        ]);
        setDevices(await devicesRes.json());
        const defaults = await defaultsRes.json();
        setUploadOnSec(defaults.uploadOnSec);
        setUploadOffSec(defaults.uploadOffSec);
      } catch (e) {
        setError(e.message || String(e));
      }
    })();
  }, []);

  const selectedDevice = devices.find((d) => String(d.id) === String(deviceId));
  const imei = selectedDevice?.uniqueId ?? '';

  const previewQuery = useMemo(() => {
    const params = new URLSearchParams({
      uploadOnSec: String(uploadOnSec),
      uploadOffSec: String(uploadOffSec),
    });
    if (adminPhone.trim()) {
      params.set('adminPhone', adminPhone.trim());
    }
    return params.toString();
  }, [adminPhone, uploadOnSec, uploadOffSec]);

  useEffect(() => {
    (async () => {
      try {
        const response = await relayFetch(`/provision/preview?${previewQuery}`);
        const plan = await response.json();
        setPreviewSteps(plan.steps || []);
      } catch {
        setPreviewSteps([]);
      }
    })();
  }, [previewQuery]);

  const handleInitialize = useCatchCallback(async () => {
    if (!imei || !adminPhone.trim()) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const response = await relayFetch('/provision/initialize', {
        method: 'POST',
        body: JSON.stringify({
          imei: imei.trim(),
          adminPhone: adminPhone.trim(),
          uploadOnSec: Number(uploadOnSec),
          uploadOffSec: Number(uploadOffSec),
        }),
      });
      setResult(await response.json());
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setBusy(false);
    }
  }, [imei, adminPhone, uploadOnSec, uploadOffSec]);

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

        <TextField
          fullWidth
          margin="normal"
          label={t('relayAdminPhone')}
          value={adminPhone}
          onChange={(e) => setAdminPhone(e.target.value)}
          helperText={t('relayAdminPhoneHelp')}
          placeholder="15551234567"
        />
        <TextField
          fullWidth
          margin="normal"
          type="number"
          label={t('relayUploadOnSec')}
          value={uploadOnSec}
          onChange={(e) => setUploadOnSec(e.target.value)}
          helperText={t('relayUploadOnHelp')}
          inputProps={{ min: 10, max: 18000 }}
        />
        <TextField
          fullWidth
          margin="normal"
          type="number"
          label={t('relayUploadOffSec')}
          value={uploadOffSec}
          onChange={(e) => setUploadOffSec(e.target.value)}
          helperText={t('relayUploadOffHelp')}
          inputProps={{ min: 10, max: 18000 }}
        />

        <Accordion sx={{ mt: 2 }} defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">{t('relayProvisionTemplate')}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" color="text.secondary" paragraph>
              {t('relayProvisionTemplateHint')}
            </Typography>
            <List dense disablePadding>
              {previewSteps.map((step) => (
                <ListItem key={step.command} disableGutters>
                  <ListItemText
                    primary={step.label}
                    secondary={step.command}
                    primaryTypographyProps={{ variant: 'body2' }}
                    secondaryTypographyProps={{ fontFamily: 'monospace', fontSize: '0.8rem' }}
                  />
                </ListItem>
              ))}
            </List>
          </AccordionDetails>
        </Accordion>

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
            <Typography variant="body2" sx={{ mt: 1 }}>
              {t('relayProvisionVerifyHint')}
            </Typography>
            {result.results && (
              <List dense>
                {result.results.map((r) => (
                  <ListItem key={r.index} disableGutters>
                    <ListItemText
                      primary={`${r.index + 1}. ${r.payload}`}
                      secondary={typeof r.result === 'object' ? JSON.stringify(r.result) : String(r.result)}
                      secondaryTypographyProps={{ fontSize: '0.75rem' }}
                    />
                  </ListItem>
                ))}
              </List>
            )}
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
