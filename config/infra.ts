export const SERVICE_ID = 'octopus-tariff-switcher';
export const AWS_REGION = 'eu-west-2';

// Lambdas
export const TARIFF_SWITCHER_NAME = SERVICE_ID;
export const YESTERDAYS_TARIFF_PUBLISHER_NAME = `${SERVICE_ID}-yesterdays-tariff-publisher`;
export const HISTORICAL_TARIFF_PUBLISHER_NAME = `${SERVICE_ID}-historical-tariff-publisher`;
export const TARIFF_DATA_QUEUE_PROCESSOR_NAME = `${SERVICE_ID}-tariff-data-queue-processor`;

// DynamoDB
export const DAILY_USAGE_TABLE_NAME = `${SERVICE_ID}-daily-usage-table`;

// SQS
export const TARIFF_DATA_WRITE_DLQ_NAME = `${SERVICE_ID}-write-dlq`;
export const TARIFF_DATA_WRITE_QUEUE_NAME = `${SERVICE_ID}-write-queue`;

// Api Gateway
export const API_NAME = `${SERVICE_ID}-api`;
