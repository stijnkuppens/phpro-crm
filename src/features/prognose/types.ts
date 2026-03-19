export type PrognoseLineAction = 'copy' | 'custom' | 'stop';

export type PrognoseLine = {
  clientId: string;
  clientName: string;
  divisionId: string;
  divisionName: string;
  serviceName: string;
  lastKnownTotal: number;
  forecastTotal: number;
  action: PrognoseLineAction;
};
