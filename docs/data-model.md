# Data Model & Status Lifecycle

## Status Lifecycle
CREATED -> AWAITING_PICKUP -> IN_TRANSIT -> AT_RETAIL -> AVAILABLE

Additional statuses: WITHDRAWN, RECALLED (A recalled batch cannot return to AVAILABLE).

## Data Model
- User: id, name, email, passwordHash, role, organization
- Farm: id, name, location, farmerId
- Batch: id, productName, variety, farmId/farmName, origin, harvestDate, quantityKg, ownerOrganization, status, verificationId
- Trace event: id, batchId, type, dateTime, actorOrganization, note, transactionId
- Shipment: id, batchId, carrierOrganization, recipientOrganization, status, dispatchedAt, deliveredAt
- Condition: id, shipmentId, recordedAt, temperatureC, humidityPct
- Recall: id, batchId, reason, severity, issuedAt, acknowledged
