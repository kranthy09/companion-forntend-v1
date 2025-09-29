# Create the project structure

mkdir -p src/{components,lib,hooks,stores,types,utils,styles}
mkdir -p src/components/{ui,features,layout,providers}
mkdir -p src/components/features/{auth,notes,tasks,profile}
mkdir -p src/lib/{api,auth,websockets,utils}
mkdir -p src/app/{auth,notes,tasks,profile}
mkdir -p src/styles/{globals,themes}

# Create essential files

touch src/lib/utils.ts
touch src/lib/api/client.ts
touch src/lib/api/endpoints.ts
touch src/lib/auth/manager.ts
touch src/types/api.ts
touch src/types/auth.ts
touch src/types/notes.ts

# Create component files

touch src/components/ui/{button,input,card,loading}.tsx
touch src/components/layout/{header,sidebar,footer}.tsx
touch src/components/providers/{query-provider,auth-provider,theme-provider}.tsx
