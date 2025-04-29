# Database Schema Example

```
|        PK       |      SK      |   dailyKwhTotal  | tariffId |   tariffName  | tariffCost | tariffStandingCharge |        readAt       | consumptionDelta | costDelta |
|:---------------:|:------------:|:----------------:|:--------:|:-------------:|:----------:|:---------------------:|:-------------------:|:----------------:|:----------------:|
| DATE#2025-04-04 | TOTAL        | 1534.00          | -        | -             | -          | -                     | -                   | -                | -                |
| DATE#2025-04-04 | TARIFF#agile | -                | agile    | Agile Octopus | 139.1567   | 45.00                 | -                   | -                | -                |
| DATE#2025-04-04 | TARIFF#cosy  | -                | cosy     | Cosy Octopus  | 207.5533   | 50.00                 | -                   | -                | -                |
| DATE#2025-04-04 | TARIFF#go    | -                | go       | Octopus Go    | 216.9138   | 55.00                 | -                   | -                | -                |
| DATE#2025-04-04 | USAGE#05:30  | -                | -        | -             | -          | -                     | 2025-04-04T05:30:00 | 87.0000          | 1.9394           |
| DATE#2025-04-04 | USAGE#06:00  | -                | -        | -             | -          | -                     | 2025-04-04T06:00:00 |                  |                  |
```
