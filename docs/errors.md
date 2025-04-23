Console Error


Error: Supabase not configured

lib\supabase-client.ts (30:64) @ Object.single


  28 |             order: () => mockClient.from(),
  29 |             limit: () => mockClient.from(),
> 30 |             single: () => Promise.resolve({ data: null, error: new Error("Supabase not configured") }),
     |                                                                ^
  31 |           }
  32 |         },
  33 |       } as any
Call Stack
4

Object.single
lib\supabase-client.ts (30:64)
getUserSettings
lib\settings-service.ts (93:106)
SettingsClient.useEffect.loadSettings
app\settings\settings-client.tsx (88:47)
SettingsClient.useEffect
app\settings\settings-client.tsx (123:5)