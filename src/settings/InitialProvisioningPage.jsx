import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Checkbox,
  FormControl,
  FormControlLabel,
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

const OPTION_KEYS = ['stop', 'turn', 'suppress', 'tow'];

const mergeTemplateSteps = (serverSteps, previousSteps) => {
  const prevById = new Map((previousSteps || []).map((s) => [s.id, s]));
  return (serverSteps || []).map((step) => {
    const prev = step.id ? prevById.get(step.id) : null;
    if (!prev) {
      return { ...step, enabled: step.enabled !== false };
    }
    return {
      ...step,
      label: prev.label ?? step.label,
      command: prev.command ?? step.command,
      enabled: prev.enabled !== false,
    };
  });
};

const InitialProvisioningPage = () => {
  const t = useTranslation();
  const { classes } = useSettingsStyles();
  const [devices, setDevices] = useState([]);
  const [deviceId, setDeviceId] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [uploadOnSec, setUploadOnSec] = useState(20);
  const [uploadOffSec, setUploadOffSec] = useState(300);
  const [uploadSmartMotion, setUploadSmartMotion] = useState(true);
  const [uploadMotionDistanceM, setUploadMotionDistanceM] = useState(200);
  const [factoryReset, setFactoryReset] = useState(false);
  const [provisionOptions, setProvisionOptions] = useState({
    stop: false,
    turn: false,
    suppress: true,
    tow: false,
  });
  const [templateSteps, setTemplateSteps] = useState([]);
  const [templateTouched, setTemplateTouched] = useState(false);
  const skipPreviewMerge = useRef(false);
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
        if (defaults.uploadSmartMotion !== undefined) {
          setUploadSmartMotion(defaults.uploadSmartMotion);
        }
        if (defaults.uploadMotionDistanceM !== undefined) {
          setUploadMotionDistanceM(defaults.uploadMotionDistanceM);
        }
        if (defaults.defaultAdminMasterPhoneNumber) {
          setAdminPhone(defaults.defaultAdminMasterPhoneNumber);
        }
        if (defaults.provisionOptions) {
          setProvisionOptions(defaults.provisionOptions);
        }
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
      uploadSmartMotion: uploadSmartMotion ? '1' : '0',
      uploadMotionDistanceM: String(uploadMotionDistanceM),
    });
    if (adminPhone.trim()) {
      params.set('adminPhone', adminPhone.trim());
    }
    if (factoryReset) {
      params.set('factoryReset', '1');
    }
    OPTION_KEYS.forEach((key) => {
      if (provisionOptions[key]) {
        params.set(key, '1');
      }
    });
    if (templateTouched && templateSteps.length > 0) {
      params.set('steps', JSON.stringify(templateSteps));
    }
    return params.toString();
  }, [adminPhone, uploadOnSec, uploadOffSec, uploadSmartMotion, uploadMotionDistanceM, factoryReset, provisionOptions, templateSteps, templateTouched]);

  useEffect(() => {
    (async () => {
      try {
        const response = await relayFetch(`/provision/preview?${previewQuery}`);
        const plan = await response.json();
        if (skipPreviewMerge.current) {
          skipPreviewMerge.current = false;
          return;
        }
        setTemplateSteps((prev) => mergeTemplateSteps(plan.steps || [], templateTouched ? prev : []));
      } catch {
        if (!templateTouched) {
          setTemplateSteps([]);
        }
      }
    })();
  }, [previewQuery, templateTouched]);

  const setOption = useCallback((key, checked) => {
    setProvisionOptions((prev) => ({ ...prev, [key]: checked }));
    setTemplateTouched(false);
  }, []);

  const updateStep = useCallback((index, patch) => {
    setTemplateTouched(true);
    setTemplateSteps((prev) => prev.map((step, i) => (i === index ? { ...step, ...patch } : step)));
  }, []);

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
          uploadSmartMotion,
          uploadMotionDistanceM: Number(uploadMotionDistanceM),
          factoryReset,
          stop: provisionOptions.stop,
          turn: provisionOptions.turn,
          suppress: provisionOptions.suppress,
          tow: provisionOptions.tow,
          steps: templateSteps,
        }),
      });
      setResult(await response.json());
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setBusy(false);
    }
  }, [imei, adminPhone, uploadOnSec, uploadOffSec, uploadSmartMotion, uploadMotionDistanceM, factoryReset, provisionOptions, templateSteps]);

  const resetTemplateFromServer = useCatchCallback(async () => {
    skipPreviewMerge.current = true;
    setTemplateTouched(false);
    const params = new URLSearchParams({
      uploadOnSec: String(uploadOnSec),
      uploadOffSec: String(uploadOffSec),
      uploadSmartMotion: uploadSmartMotion ? '1' : '0',
      uploadMotionDistanceM: String(uploadMotionDistanceM),
      adminPhone: adminPhone.trim() || '15550001234',
    });
    if (factoryReset) {
      params.set('factoryReset', '1');
    }
    OPTION_KEYS.forEach((key) => {
      if (provisionOptions[key]) {
        params.set(key, '1');
      }
    });
    const response = await relayFetch(`/provision/preview?${params}`);
    const plan = await response.json();
    setTemplateSteps((plan.steps || []).map((s) => ({ ...s, enabled: true })));
  }, [adminPhone, uploadOnSec, uploadOffSec, uploadSmartMotion, uploadMotionDistanceM, factoryReset, provisionOptions]);

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
        <Alert severity="warning" sx={{ mb: 2 }}>
          {t('relayAdminOrderHint')}
        </Alert>
        <FormControlLabel
          control={(
            <Checkbox
              checked={factoryReset}
              onChange={(e) => {
                setFactoryReset(e.target.checked);
                setTemplateTouched(false);
              }}
            />
          )}
          label={t('relayFactoryReset')}
        />

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
          onChange={(e) => {
            setAdminPhone(e.target.value);
            setTemplateTouched(false);
          }}
          helperText={t('relayAdminPhoneHelp')}
          placeholder="15551234567"
        />
        <FormControlLabel
          control={(
            <Checkbox
              checked={uploadSmartMotion}
              onChange={(e) => {
                setUploadSmartMotion(e.target.checked);
                setTemplateTouched(false);
              }}
            />
          )}
          label={t('relayUploadSmartMotion')}
        />
        <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mt: -1, mb: 1 }}>
          {uploadSmartMotion ? t('relayUploadSmartMotionHelpOn') : t('relayUploadSmartMotionHelpOff')}
        </Typography>
        <TextField
          fullWidth
          margin="normal"
          type="number"
          label={uploadSmartMotion ? t('relayUploadMovingSec') : t('relayUploadOnSec')}
          value={uploadOnSec}
          onChange={(e) => {
            setUploadOnSec(e.target.value);
            setTemplateTouched(false);
          }}
          helperText={uploadSmartMotion ? t('relayUploadMovingHelp') : t('relayUploadOnHelp')}
          inputProps={{ min: 10, max: 18000 }}
        />
        <TextField
          fullWidth
          margin="normal"
          type="number"
          label={uploadSmartMotion ? t('relayUploadIdleSec') : t('relayUploadOffSec')}
          value={uploadOffSec}
          onChange={(e) => {
            setUploadOffSec(e.target.value);
            setTemplateTouched(false);
          }}
          helperText={uploadSmartMotion ? t('relayUploadIdleHelp') : t('relayUploadOffHelp')}
          inputProps={{ min: 10, max: 18000 }}
        />
        {uploadSmartMotion && (
          <TextField
            fullWidth
            margin="normal"
            type="number"
            label={t('relayUploadMotionDistanceM')}
            value={uploadMotionDistanceM}
            onChange={(e) => {
              setUploadMotionDistanceM(e.target.value);
              setTemplateTouched(false);
            }}
            helperText={t('relayUploadMotionDistanceHelp')}
            inputProps={{ min: 10, max: 9999 }}
          />
        )}

        <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
          {t('relayProvisionOptionsTitle')}
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          {t('relayProvisionOptionsHint')}
        </Typography>

        {OPTION_KEYS.map((key) => (
          <Box key={key} sx={{ mb: 1.5, pl: 0.5 }}>
            <FormControlLabel
              control={(
                <Checkbox
                  checked={Boolean(provisionOptions[key])}
                  onChange={(e) => setOption(key, e.target.checked)}
                />
              )}
              label={t(`relayOption${key.charAt(0).toUpperCase()}${key.slice(1)}Label`)}
            />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mt: -0.5 }}>
              {t(`relayOption${key.charAt(0).toUpperCase()}${key.slice(1)}Help`)}
            </Typography>
          </Box>
        ))}

        <Accordion sx={{ mt: 2 }} defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">{t('relayProvisionTemplate')}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" color="text.secondary" paragraph>
              {t('relayProvisionTemplateHint')}
            </Typography>
            <Button size="small" onClick={resetTemplateFromServer} sx={{ mb: 1 }}>
              {t('relayProvisionTemplateReset')}
            </Button>
            <List dense disablePadding>
              {templateSteps.map((step, index) => (
                <ListItem
                  key={step.id || step.command || index}
                  disableGutters
                  sx={{ flexDirection: 'column', alignItems: 'stretch', mb: 1.5 }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Checkbox
                      checked={step.enabled !== false}
                      onChange={(e) => updateStep(index, { enabled: e.target.checked })}
                    />
                    <TextField
                      size="small"
                      fullWidth
                      label={t('relayStepLabel')}
                      value={step.label || ''}
                      onChange={(e) => updateStep(index, { label: e.target.value })}
                    />
                  </Box>
                  <TextField
                    size="small"
                    fullWidth
                    margin="dense"
                    label={t('relayStepCommand')}
                    value={step.command || ''}
                    onChange={(e) => updateStep(index, { command: e.target.value })}
                    inputProps={{ style: { fontFamily: 'monospace', fontSize: '0.85rem' } }}
                    helperText={step.optional ? t('relayStepOptional') : undefined}
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
            || templateSteps.filter((s) => s.enabled !== false && s.command?.trim()).length === 0
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
