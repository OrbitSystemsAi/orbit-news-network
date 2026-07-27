import { database } from "../src/lib/database/client";
import { generateApiKey, hashApiKey } from "../src/server/services/api-keys";

const projectSlug = process.argv[2] ?? "career-pivot";
const name = process.argv[3] ?? "Local development key";
const scopes = (process.argv[4] ?? "news:read,news:feedback").split(",").filter(Boolean);
const secret = process.env.API_KEY_HASH_SECRET;
if (!secret) throw new Error("API_KEY_HASH_SECRET is required.");
const project = await database.project.findFirst({where:{slug:projectSlug,status:"ACTIVE"}});
if (!project) throw new Error("Active project not found.");
const generated = generateApiKey(project.environment === "PRODUCTION" ? "production" : "development");
await database.projectApiKey.create({data:{projectId:project.id,name,environment:project.environment,prefix:generated.prefix,keyHash:hashApiKey(generated.key,secret),scopes,status:"ACTIVE"}});
console.log("API key created. Copy it now; it cannot be retrieved again:");
console.log(generated.key);
await database.$disconnect();
