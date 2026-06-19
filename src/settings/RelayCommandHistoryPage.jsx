import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Chip,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import PageLayout from '../common/components/PageLayout';
import SettingsMenu from './components/SettingsMenu';
import { useTranslation } from '../common/components/LocalizationProvider';
import useSettingsStyles from './common/useSettingsStyles';
import relayFetch from '../common/util/relayApi';

const RelayCommandHistoryPage = () => {
  const t = useTranslation();
  const { classes } = useSettingsStyles();
  const [devices, setDevices] = useState([]);
  const [deviceId, setDeviceId] = useState('');
  const [history, setHistory] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    relayFetch('/devices')
      .then((r) => r.json())
      .then(setDevices)
      .catch((e) => setError(e.message || String(e)));
  }, []);

  useEffect(() => {
    if (!deviceId) {
      setHistory(null);
      return;
    }
    setError(null);
    relayFetch(`/history/${deviceId}`)
      .then((r) => r.json())
      .then(setHistory)
      .catch((e) => setError(e.message || String(e)));
  }, [deviceId]);

  return (
    <PageLayout menu={<SettingsMenu />} breadcrumbs={['settingsTitle', 'relayCommandHistory']}>
      <Container maxWidth="md" className={classes.container}>
        <Typography variant="h6" gutterBottom>
          {t('relayCommandHistory')}
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          {t('relayCommandHistoryHint')}
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
                {device.name} ({device.uniqueId})
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {error && <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>}

        {history && (
          <>
            <Box sx={{ my: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
              <Chip label={history.status} size="small" />
              <Typography variant="body2">
                {t('relayQueuePending')}: {history.queueDepth}
              </Typography>
            </Box>

            <Typography variant="subtitle1" gutterBottom>
              {t('relayTcpQueue')}
            </Typography>
            <Table size="small" sx={{ mb: 3 }}>
              <TableHead>
                <TableRow>
                  <TableCell>{t('sharedStatus')}</TableCell>
                  <TableCell>{t('commandMessage')}</TableCell>
                  <TableCell>{t('relayCreatedAt')}</TableCell>
                  <TableCell>{t('relayErrorColumn')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {history.queue.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4}>{t('sharedNoData')}</TableCell>
                  </TableRow>
                )}
                {history.queue.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.status}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{row.payload}</TableCell>
                    <TableCell>{row.created_at}</TableCell>
                    <TableCell>{row.error || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Typography variant="subtitle1" gutterBottom>
              {t('relayProvisionHistory')}
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{t('sharedStatus')}</TableCell>
                  <TableCell>{t('relayCommandsSent')}</TableCell>
                  <TableCell>{t('relayCreatedAt')}</TableCell>
                  <TableCell>{t('relayErrorColumn')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {history.provisions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4}>{t('sharedNoData')}</TableCell>
                  </TableRow>
                )}
                {history.provisions.map((run) => (
                  <TableRow key={run.id}>
                    <TableCell>{run.status}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                      {(run.commands || []).join(' → ')}
                    </TableCell>
                    <TableCell>{run.createdAt}</TableCell>
                    <TableCell>{run.error || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Alert severity="info" sx={{ mt: 2 }}>
              {t('relayNoDeviceSmsReply')}
            </Alert>
          </>
        )}
      </Container>
    </PageLayout>
  );
};

export default RelayCommandHistoryPage;
