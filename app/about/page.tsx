"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookOpen, Users, Award, Globe } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { motion } from "framer-motion"
import Image from "next/image"

export default function AboutPage() {
  function Tooltip({ label, children }: { label: string; children: React.ReactNode }) {
    const [isHovered, setIsHovered] = useState(false);
    
    return (
      <div 
        className="relative flex flex-col items-center"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {children}
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="absolute -bottom-6 text-xs text-white bg-black px-2 py-1 rounded-md shadow-md"
          >
            {label}
          </motion.div>
        )}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <div className="flex flex-col items-center justify-center bg-gray-50 p-6 h-48">
          <h1 className="text-gray-800 text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
            À propos du LMCS
          </h1>
          <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
            Laboratoire des Méthodes de Conception de Systèmes à l'ESI Alger
          </p>
        </div>
          
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-8">
            Organigramme du LMCS
          </h1>

          <div className="relative w-full max-w-4xl h-[400px] rounded-2xl overflow-hidden shadow-lg">
            <Image
              src="/images/organigramme.jpg"
              alt="Organigramme du LMCS"
              fill
              className="object-contain"
            />
          </div>
        </div>
        
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <Tabs defaultValue="overview" className="space-y-8">
              <TabsList className="grid w-full grid-cols-4 bg-[#d2e8ff]">
                <TabsTrigger value="overview">Présentation</TabsTrigger>
                <TabsTrigger value="research">Axes de recherche</TabsTrigger>
                <TabsTrigger value="facilities">Équipements</TabsTrigger>
                <TabsTrigger value="collaborations">Collaborations</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-8">
                <div className="grid gap-8 md:grid-cols-2">
                  <div>
                    <h2 className="text-3xl font-bold tracking-tight mb-4">Notre mission</h2>
                    <p className="text-muted-foreground mb-4">
                      Le Laboratoire des Méthodes de Conception de Systèmes (LMCS) de l'ESI Alger est dédié à la recherche avancée en informatique,
                      mathématiques et domaines connexes. Notre mission est de mener des recherches de pointe, favoriser l'innovation et former la prochaine génération
                      de scientifiques et d'ingénieurs.
                    </p>
                    <p className="text-muted-foreground">
                      Fondé en 2001, le LMCS est devenu l'un des laboratoires de recherche les plus importants en Algérie, avec un accent particulier sur l'intelligence
                      artificielle, l'ingénierie logicielle, la cybersécurité et la science des données. Nos chercheurs collaborent avec des institutions académiques et
                      des partenaires industriels du monde entier pour relever des défis complexes et développer des solutions innovantes.
                    </p>
                  </div>
                  <div className="grid gap-4 grid-cols-2">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                          Chercheurs
                        </CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">38</div>
                        <p className="text-xs text-muted-foreground">
                          Enseignants-chercheurs
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                          Publications
                        </CardTitle>
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">400+</div>
                        <p className="text-xs text-muted-foreground">
                          Publications scientifiques
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                          Projets
                        </CardTitle>
                        <Award className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">40+</div>
                        <p className="text-xs text-muted-foreground">
                          Projets de recherche actifs
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                          Partenaires
                        </CardTitle>
                        <Globe className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <div className="text-2xl font-bold">15</div>
                      <p className="text-xs text-muted-foreground">
                        Collaborations internationales
                      </p>
                    </Card>
                  </div>
                </div>
                
                <h2 className="text-3xl font-bold tracking-tight mb-4">À propos du LMCS</h2>
                <div className="">
                  <Card>
                    <CardHeader>
                      <CardTitle>Le Laboratoire LMCS</CardTitle>
                      <CardDescription>Méthodes de Conception de Systèmes</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Le laboratoire LMCS (Méthodes de Conception de Systèmes) affilié à l'Ecole nationale Supérieure d'Informatique est opérationnel depuis 2001. Il regroupe 38 enseignants-chercheurs et 102 doctorants D-LMD répartis sur 06 équipes activant dans la sécurité informatique, les systèmes embarqués, l'hyper-média, le traitement d'images, l'ingénierie des systèmes d'information et des systèmes de connaissances, l'aide à la décision stratégique, les méthodes de résolution de problème d'optimisation combinatoire.
                      </p>
                      <p className="text-sm text-muted-foreground mt-4">
                        Le laboratoire participe activement à la formation doctorale, à la formation des étudiants en master et à celle des ingénieurs. Les enseignants chercheurs du LMCS participent activement aux projets PRFU (projets Nationaux) et pour certains dans des projets de recherche internationaux.
                      </p>
                      <p className="text-sm text-muted-foreground mt-4">
                        Le laboratoire s'investit, par ailleurs, depuis plusieurs années à mettre ses compétences à travers des partenariats actifs et des actions de recherche et développement au profit du secteur socio-économique. Chercheurs, enseignants et ingénieurs sont les bienvenus sur notre site.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="research" className="space-y-8">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight mb-4">Axes de recherche</h2>
                  <p className="text-muted-foreground mb-6">
                    Le LMCS mène des recherches dans plusieurs domaines clés de l'informatique et des mathématiques, en se concentrant à la fois sur les fondements théoriques et les applications pratiques.
                  </p>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <Card>
                      <CardHeader>
                        <CardTitle>Conception et optimisation des systèmes</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                          <li>Systèmes embarqués</li>
                          <li>Systèmes hétérogènes</li>
                          <li>Réseaux de capteurs sans fil</li>
                          <li>Systèmes Network-on-Chip (NoC)</li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Science des données et IA</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                          <li>Apprentissage automatique et analyse de données</li>
                          <li>Applications de l'IA au développement économique</li>
                          <li>Processus intelligents</li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Cloud Computing et IoT</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                          <li>Convergence IoT et Cloud</li>
                          <li>Solutions de stockage cloud</li>
                          <li>Confiance et placement des données dans le cloud</li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Systèmes d'information et génie logiciel</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                          <li>Conception et optimisation des systèmes</li>
                          <li>Automatisation des processus métiers</li>
                          <li>Représentation et classification des connaissances</li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Réseaux et systèmes de communication</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                          <li>Réseaux de capteurs sans fil</li>
                          <li>Systèmes distribués et mobiles</li>
                          <li>Architectures de communication avancées</li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Cybersécurité et Blockchain</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                          <li>Confiance, vie privée et sécurité dans les SI</li>
                          <li>Technologies Blockchain</li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Méthodes formelles et optimisation</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                          <li>Raisonnement formel en conception de systèmes</li>
                          <li>Optimisation multicritère</li>
                          <li>Mapping hétérogène NoC</li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Formation et développement de la recherche</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                          <li>Formation doctorale et conférences</li>
                          <li>Collaboration et innovation en recherche</li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="facilities" className="space-y-8">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight mb-4">Équipements de recherche</h2>
                  <p className="text-muted-foreground mb-6">
                    Le LMCS dispose d'équipements de pointe pour soutenir la recherche avancée en informatique et mathématiques.
                  </p>
                  <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle>Cluster de calcul haute performance</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                          Notre cluster HPC comprend 32 nœuds de calcul avec des GPU NVIDIA A100, fournissant aux chercheurs la puissance de calcul nécessaire pour les charges de travail exigeantes en IA et science des données.
                        </p>
                        <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                          <li>256 cœurs CPU</li>
                          <li>64 GPU NVIDIA A100</li>
                          <li>1 PB de capacité de stockage</li>
                          <li>Réseau 100 Gbps</li>
                        </ul>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle>Laboratoire de cybersécurité</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                          Un espace dédié à la recherche en sécurité, avec des réseaux isolés pour l'analyse de malware, les tests d'intrusion et l'évaluation des protocoles de sécurité.
                        </p>
                        <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                          <li>Environnement de test isolé</li>
                          <li>Modules de sécurité matérielle</li>
                          <li>Outils d'analyse du trafic réseau</li>
                          <li>Postes de travail spécialisés</li>
                        </ul>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle>Laboratoire IoT et Edge Computing</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                          Ce laboratoire abrite divers appareils IoT, capteurs et plateformes de edge computing pour la recherche sur les systèmes distribués et les environnements intelligents.
                        </p>
                        <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                          <li>Réseaux de capteurs et actionneurs</li>
                          <li>Appareils de edge computing</li>
                          <li>Équipement de réseautage sans fil</li>
                          <li>Environnement de test intelligent</li>
                        </ul>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle>Espaces de recherche collaboratifs</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                          Des espaces modernes et flexibles conçus pour faciliter la collaboration entre chercheurs, étudiants et chercheurs invités.
                        </p>
                        <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                          <li>Salles de réunion avec visioconférence</li>
                          <li>Espaces de travail ouverts</li>
                          <li>Tableaux blancs numériques</li>
                          <li>Équipements de présentation</li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="collaborations" className="space-y-8">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight mb-4">Collaborations internationales</h2>
                  <p className="text-muted-foreground mb-6">
                    Le LMCS entretient des collaborations actives avec des institutions et partenaires industriels de premier plan dans le monde entier.
                  </p>
                  <div className="">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-800 text-white">
                          <tr>
                            <th className="px-4 py-2 text-left font-semibold">Période</th>
                            <th className="px-4 py-2 text-left font-semibold">Partenaire</th>
                            <th className="px-4 py-2 text-left font-semibold">Types d'actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          <tr>
                            <td className="px-4 py-3">2006-2009</td>
                            <td className="px-4 py-3">SUMT (Service Universitaire Médecine de Travail), Hôpital Rouiba, Alger</td>
                            <td className="px-4 py-3">(e-santé) Banque de données ; S.I Intégré médecine de travail ; évaluation des risques professionnels en santé</td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3">2015 à ce jour</td>
                            <td className="px-4 py-3">INCC (Institut Nationale de Criminologie et Criminalistique) (Gendarmerie Nationale)</td>
                            <td className="px-4 py-3">(Gouvernance, sécurité) : Détection et prédiction de l'évolution des communautés dans les réseaux (application à la criminalité)</td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3">2018 à ce jour</td>
                            <td className="px-4 py-3">CRD (Centre de Recherche et Développement) de la Gendarmerie Nationale</td>
                            <td className="px-4 py-3">(e-Sécurité) : Analyse du trafic, investigation forensique, reconnaissance automatique, analyse prédictive</td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3">2013 à ce jour</td>
                            <td className="px-4 py-3">CDTA (Centre Des Technologies Avancées), Baba Hacen, Alger</td>
                            <td className="px-4 py-3">Dissémination scientifique, Partage d'expérience</td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3">2010 à ce jour</td>
                            <td className="px-4 py-3">CERIST (Centre d'Etudes et de Recherches en Information scientifique et Technique), Alger</td>
                            <td className="px-4 py-3">Formation à la recherche, partage de ressources</td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3">2015-2016</td>
                            <td className="px-4 py-3">INPV (Institut National de Protection des Végétaux), El Harrach, Alger</td>
                            <td className="px-4 py-3">(e-agriculture, gestion des catastrophes) : Crowd-sourcing, Gestion collaborative des crises (lutte antiacridienne)</td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3">2018-2020</td>
                            <td className="px-4 py-3">SMT (Sonelgaz Médecine du Travail) (Filiale du Groupe Sonelgaz)</td>
                            <td className="px-4 py-3">(e-santé) : Géo-référencement de données pour la prévention des risques professionnels en santé, Traçabilité & mobilité</td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3">2018-2019</td>
                            <td className="px-4 py-3">CNPSR (Centre National de la prévention routière)</td>
                            <td className="px-4 py-3">(prévention et sécurité) : Banque de données, e-formation des conducteurs, sensibilisation à la sécurité routière, jeux vidéos</td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3">2016 à ce jour</td>
                            <td className="px-4 py-3">RME (Réseau mixte des Ecoles)</td>
                            <td className="px-4 py-3">(e-formation): Innovation pédagogique, Social computing for enhancing Relational intelligence, e-learning</td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3">2020-</td>
                            <td className="px-4 py-3">BRANDT Electronics</td>
                            <td className="px-4 py-3">(réseaux et sécurité): les « block-chains » dans l'Internet des objets</td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3">2020-</td>
                            <td className="px-4 py-3">MICL (Ministère de l'Intérieur & Collectivités Locales)</td>
                            <td className="px-4 py-3">(sécurité): Multimodalités et sécurité</td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3">2021-</td>
                            <td className="px-4 py-3">Centre de Simulation Médicale – Service de neurochirurgie – CHU «Ibn Rochd» de Annaba</td>
                            <td className="px-4 py-3">(e-santé) Reconnaissance et classification de tumeurs cérébrales dans des IRM-3D multimodales en utilisant le Deep Learning</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h2 className="text-3xl font-bold tracking-tight mb-4">Projets collaboratifs</h2>
                  <div className="">
                    <Card>
                      <div className="min-h-screen bg-gray-50 p-6 space-y-8">
                        <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="md:col-span-2 row-span-2">
                            <div className="w-full h-72 relative rounded-2xl overflow-hidden shadow-lg">
                              <Image src="/images/big-image.png" alt="Coopération" fill className="object-cover" />
                            </div>
                          </div>
                          {["/images/small1.png", "/images/small2.png", "/images/small3.png"].map((src, idx) => (
                            <div key={idx} className="w-full h-36 relative rounded-2xl overflow-hidden shadow-md">
                              <Image src={src} alt={`Petite image ${idx + 1}`} fill className="object-cover" />
                            </div>
                          ))}
                        </section>

                        <section className="overflow-x-auto">
                          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Années 2016-2017</h2>
                          <table className="min-w-full bg-white rounded-xl shadow-lg overflow-hidden">
                            <thead className="bg-gray-800 text-white">
                              <tr>
                                <th className="px-4 py-3 text-left">Bénéficiaires</th>
                                <th className="px-4 py-3 text-left">Statut</th>
                                <th className="px-4 py-3 text-left">Période planifiée de la mobilité</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {[
                                { name: "EL Marai Oussama", status: "Doctorant LMCS", period: "16/6/2017 au 16/9/2017" },
                                { name: "Boudi Abderrahmane", status: "Doctorant LMCS", period: "Septembre 2017 à Novembre 2017" },
                                { name: "Hellaoui Hamed", status: "Doctorant LMCS", period: "Août 2017 à Octobre 2017" },
                                { name: "Si HAMDI Katia", status: "Master", period: "Janvier 2017 à Mai 2017" },
                              ].map((row, idx) => (
                                <tr key={idx} className="hover:bg-gray-100">
                                  <td className="px-4 py-3">{row.name}</td>
                                  <td className="px-4 py-3">{row.status}</td>
                                  <td className="px-4 py-3">{row.period}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </section>

                        <section className="space-y-4">
                          <h2 className="text-2xl font-semibold text-gray-700">Membres coordonateurs au niveau de ESI</h2>
                          <ul className="list-disc list-inside text-gray-600">
                            <li>Mr Y. CHALLAL, Professeur, LMCS</li>
                            <li>Mme. F.Z. BENHAMIDA, chargée de projets (ICM), LMCS</li>
                          </ul>

                          <h2 className="text-2xl font-semibold text-gray-700">Facilitateur</h2>
                          <ul className="list-disc list-inside text-gray-600">
                            <li>DREFC, AR. GHOMARI, DREFC ESI, LMCS</li>
                          </ul>
                        </section>
                      </div>
                    </Card>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </main>
    </div>
  )
}