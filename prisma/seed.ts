import { database } from "../src/lib/database/client";

const topics = ["Healthcare","Medicine","Real Estate","Finance","Artificial Intelligence","Technology","Careers","Employment","Remote Work","Digital Transformation","Data Analytics","Business","Marketing","Government","Education"];
const slug = (name:string) => name.toLowerCase().replace(/&/g,"and").replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"");

async function main() {
  const organization = await database.organization.upsert({
    where:{slug:"orbit-systems-ai"}, update:{name:"Orbit Systems AI",status:"ACTIVE"},
    create:{name:"Orbit Systems AI",slug:"orbit-systems-ai",status:"ACTIVE"},
  });
  const project = await database.project.upsert({
    where:{organizationId_slug:{organizationId:organization.id,slug:"career-pivot"}},
    update:{name:"Career Pivot",environment:"DEVELOPMENT",status:"ACTIVE",maximumItemsPerRequest:4,minimumRefreshIntervalMinutes:30},
    create:{organizationId:organization.id,name:"Career Pivot",slug:"career-pivot",environment:"DEVELOPMENT",status:"ACTIVE",maximumItemsPerRequest:4,minimumRefreshIntervalMinutes:30},
  });
  for (const name of topics) {
    const topic = await database.topic.upsert({where:{slug:slug(name)},update:{name,status:"ACTIVE"},create:{name,slug:slug(name),description:`${name} news and signals.`,status:"ACTIVE"}});
    await database.projectTopic.upsert({where:{projectId_topicId:{projectId:project.id,topicId:topic.id}},update:{status:"ACTIVE"},create:{projectId:project.id,topicId:topic.id,status:"ACTIVE",defaultWeight:1}});
  }
  const publications = [
    {name:"Career Pivot Community",slug:"career-pivot-community",description:"User-created career stories and community content.",defaultDistributionLevel:"APPLICATION" as const},
    {name:"Career Pivot Editorial",slug:"career-pivot-editorial",description:"Official Career Pivot articles, announcements, and product updates.",defaultDistributionLevel:"NETWORK" as const},
    {name:"Career Signals",slug:"career-signals",description:"Career insights, trends, and selected professional content.",defaultDistributionLevel:"NETWORK" as const},
  ];
  for(const publication of publications){
    await database.publication.upsert({where:{projectId_slug:{projectId:project.id,slug:publication.slug}},update:{...publication,status:"ACTIVE"},create:{projectId:project.id,...publication,status:"ACTIVE"}});
  }
  console.log("Seeded idempotent ONN configuration: organization, pilot project, topic permissions, and initial publications. No content, interaction, traffic, or API-key record was created.");
}
main().finally(()=>database.$disconnect());
