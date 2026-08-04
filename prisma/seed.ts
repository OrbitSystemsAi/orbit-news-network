import { database } from "../src/lib/database/client";

const topics = ["Healthcare","Medicine","Real Estate","Finance","Artificial Intelligence","Technology","Careers","Employment","Remote Work","Digital Transformation","Data Analytics","Business","Marketing","Government","Education"];
const slug = (name:string) => name.toLowerCase().replace(/&/g,"and").replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"");
const taxonomy = [
  { name:"Health and Wellbeing", slug:"health-and-wellbeing", children:[{name:"Health Systems and Medicine",slug:"health-systems-and-medicine",topics:["healthcare","medicine"]}] },
  { name:"Economy and Business", slug:"economy-and-business", children:[{name:"Markets and Finance",slug:"markets-and-finance",topics:["finance","real-estate"]},{name:"Business Growth",slug:"business-growth",topics:["business","marketing"]}] },
  { name:"Technology and Data", slug:"technology-and-data", children:[{name:"Artificial Intelligence and Software",slug:"ai-and-software",topics:["artificial-intelligence","technology"]},{name:"Data and Transformation",slug:"data-and-transformation",topics:["data-analytics","digital-transformation"]}] },
  { name:"Work and Careers", slug:"work-and-careers", children:[{name:"Career Development",slug:"career-development",topics:["careers","employment"]},{name:"Work Models",slug:"work-models",topics:["remote-work"]}] },
  { name:"Society and Learning", slug:"society-and-learning", children:[{name:"Public Institutions and Education",slug:"public-institutions-and-education",topics:["government","education"]}] },
];
const topicAliases: Record<string,string[]> = {
  "artificial-intelligence":["ai","machine-learning"],
  careers:["career-growth","career-change"],
  employment:["jobs","labor-market"],
  "remote-work":["hybrid-work"],
  "data-analytics":["business-intelligence"],
};

async function main() {
  const organization = await database.organization.upsert({
    where:{slug:"orbit-systems-ai"}, update:{name:"Orbit Systems AI",status:"ACTIVE"},
    create:{name:"Orbit Systems AI",slug:"orbit-systems-ai",status:"ACTIVE"},
  });
  const careerPivot = await database.project.upsert({
    where:{organizationId_slug:{organizationId:organization.id,slug:"career-pivot"}},
    update:{name:"Career Pivot",environment:"DEVELOPMENT",status:"ACTIVE",maximumItemsPerRequest:4,minimumRefreshIntervalMinutes:30},
    create:{organizationId:organization.id,name:"Career Pivot",slug:"career-pivot",environment:"DEVELOPMENT",status:"ACTIVE",maximumItemsPerRequest:4,minimumRefreshIntervalMinutes:30},
  });
  for (const name of topics) {
    const topic = await database.topic.upsert({where:{slug:slug(name)},update:{name,status:"ACTIVE"},create:{name,slug:slug(name),description:`${name} news and signals.`,status:"ACTIVE"}});
    await database.projectTopic.upsert({where:{projectId_topicId:{projectId:careerPivot.id,topicId:topic.id}},update:{status:"ACTIVE"},create:{projectId:careerPivot.id,topicId:topic.id,status:"ACTIVE",defaultWeight:1}});
  }
  const publications = [
    {name:"Career Pivot Community",slug:"career-pivot-community",description:"User-created career stories and community content.",defaultDistributionLevel:"APPLICATION" as const},
    {name:"Career Pivot Editorial",slug:"career-pivot-editorial",description:"Official Career Pivot articles, announcements, and product updates.",defaultDistributionLevel:"NETWORK" as const},
    {name:"Career Signals",slug:"career-signals",description:"Career insights, trends, and selected professional content.",defaultDistributionLevel:"NETWORK" as const},
  ];
  for(const publication of publications){
    await database.publication.upsert({where:{projectId_slug:{projectId:careerPivot.id,slug:publication.slug}},update:{...publication,status:"ACTIVE"},create:{projectId:careerPivot.id,...publication,status:"ACTIVE"}});
  }
  const osai = await database.project.upsert({
    where:{organizationId_slug:{organizationId:organization.id,slug:"osai"}},
    update:{name:"OSai",environment:"DEVELOPMENT",status:"ACTIVE"},
    create:{organizationId:organization.id,name:"OSai",slug:"osai",environment:"DEVELOPMENT",status:"ACTIVE"},
  });
  for (const name of topics) {
    const topic = await database.topic.findUniqueOrThrow({where:{slug:slug(name)}});
    await database.projectTopic.upsert({where:{projectId_topicId:{projectId:osai.id,topicId:topic.id}},update:{status:"ACTIVE"},create:{projectId:osai.id,topicId:topic.id,status:"ACTIVE",defaultWeight:1}});
  }
  await database.publication.upsert({
    where:{projectId_slug:{projectId:osai.id,slug:"osai-editorial"}},
    update:{name:"OSai Editorial",description:"Official OSai briefings, portfolio notes, and product insights.",status:"ACTIVE",defaultDistributionLevel:"NETWORK"},
    create:{projectId:osai.id,name:"OSai Editorial",slug:"osai-editorial",description:"Official OSai briefings, portfolio notes, and product insights.",status:"ACTIVE",defaultDistributionLevel:"NETWORK"},
  });
  const projects = await database.project.findMany({ include:{topicSubscriptions:{where:{status:"ACTIVE"},include:{topic:true}}} });
  for (const category of taxonomy) {
    const categoryNode = await database.taxonomyNode.upsert({ where:{slug:category.slug}, update:{name:category.name,nodeType:"CATEGORY",status:"ACTIVE"}, create:{name:category.name,slug:category.slug,nodeType:"CATEGORY",status:"ACTIVE",description:`Shared ${category.name.toLowerCase()} classification.`} });
    for (const subcategory of category.children) {
      const subcategoryNode = await database.taxonomyNode.upsert({ where:{slug:subcategory.slug}, update:{name:subcategory.name,nodeType:"SUBCATEGORY",status:"ACTIVE",parentId:categoryNode.id}, create:{name:subcategory.name,slug:subcategory.slug,nodeType:"SUBCATEGORY",status:"ACTIVE",parentId:categoryNode.id} });
      for (const topicSlug of subcategory.topics) {
        const topic = await database.topic.findUniqueOrThrow({where:{slug:topicSlug}});
        const topicNode = await database.taxonomyNode.upsert({ where:{slug:topicSlug}, update:{name:topic.name,nodeType:"TOPIC",status:"ACTIVE",parentId:subcategoryNode.id,topicId:topic.id}, create:{name:topic.name,slug:topicSlug,nodeType:"TOPIC",status:"ACTIVE",parentId:subcategoryNode.id,topicId:topic.id} });
        for (const alias of topicAliases[topicSlug] ?? []) await database.taxonomyAlias.upsert({where:{alias},update:{nodeId:topicNode.id},create:{nodeId:topicNode.id,alias}});
        for (const project of projects) {
          const subscription = project.topicSubscriptions.find(candidate=>candidate.topic.slug===topicSlug);
          if (subscription) await database.projectTaxonomyPermission.upsert({where:{projectId_taxonomyNodeId:{projectId:project.id,taxonomyNodeId:topicNode.id}},update:{status:"ACTIVE",defaultWeight:subscription.defaultWeight,inherited:false},create:{projectId:project.id,taxonomyNodeId:topicNode.id,status:"ACTIVE",defaultWeight:subscription.defaultWeight,inherited:false}});
        }
      }
      for (const project of projects) {
        const allowed = new Set(project.topicSubscriptions.map(subscription=>subscription.topic.slug));
        const matchingTopics = subcategory.topics.filter(topicSlug=>allowed.has(topicSlug));
        if (!matchingTopics.length) continue;
        await database.projectTaxonomyPermission.upsert({where:{projectId_taxonomyNodeId:{projectId:project.id,taxonomyNodeId:categoryNode.id}},update:{status:"ACTIVE",inherited:true},create:{projectId:project.id,taxonomyNodeId:categoryNode.id,status:"ACTIVE",inherited:true,defaultWeight:1}});
        await database.projectTaxonomyPermission.upsert({where:{projectId_taxonomyNodeId:{projectId:project.id,taxonomyNodeId:subcategoryNode.id}},update:{status:"ACTIVE",inherited:true},create:{projectId:project.id,taxonomyNodeId:subcategoryNode.id,status:"ACTIVE",inherited:true,defaultWeight:1}});
      }
    }
  }
  console.log("Seeded idempotent ONN configuration: organization, pilot project, topic permissions, and initial publications. No content, interaction, traffic, or API-key record was created.");
}
main().finally(()=>database.$disconnect());
