# Automatic sports schedules

The live watch face requests F1 and Springbok schedules in a Garmin background service, initially shortly after launch and then hourly. Garmin Connect on the paired phone needs an internet connection. Updates are subject to Garmin's background scheduling; they are not instantaneous.

Touch and hold HOLD REFRESH queues an extra schedule check and rereads available watch data. Garmin requires at least five minutes between temporal background runs. The existing DATA REREAD / NO HEADING feedback describes local sensor data, not confirmation that a network download finished.

F1 uses Jolpica's next race weekend, including published practice, qualifying, sprint and race times. At season end, an empty current-season response triggers a request for the following year's first race. Springbok fixtures come from SA Rugby's match-centre endpoint, keeping up to six future matches and excluding cancelled or postponed games. These external feeds can change or have incorrect/delayed information; SA Rugby's website endpoint is not a versioned public API contract.

Each feed has a separate persistent cache. Failed downloads and invalid responses preserve the last successful schedule. The next future event is selected automatically; UTC timestamps are displayed in the watch's local timezone. When the cache has no future event, SYNC NEEDED means refresh is overdue or failed; SCHEDULE TBD means a recent successful response has no upcoming entry. A valid empty response clears expired cached fixtures.

The offline Studio keeps its saved fixtures for deterministic previews and as an initial fallback before the first successful download. It does not fetch live schedules. No API key or hosted companion service is required.

Validation: native tests cover UTC parsing, invalid dates, event rollover, cancelled matches and cache preservation. The live Garmin simulator successfully downloaded and displayed both feeds. Physical-watch connectivity and battery impact still require hardware testing.

Sources: https://api.jolpi.ca/docs/ and https://springboks.rugby/match-centre/.
