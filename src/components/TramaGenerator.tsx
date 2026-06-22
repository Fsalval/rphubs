// src/components/TramaGenerator.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Wand2, 
  Sparkles, 
  Copy, 
  RefreshCw, 
  Download,
  BookOpen,
  Users,
  Heart,
  Sword,
  Ghost,
  Crown,
  Telescope,
  Flame
} from 'lucide-react';

interface TramaTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: any;
  tags: string[];
  template: string;
  variables: string[];
}

interface GeneratedTrama {
  title: string;
  description: string;
  opening: string;
  tags: string[];
  mood: string;
  difficulty: string;
}

const tramaTemplates: TramaTemplate[] = [
  {
    id: 'romance',
    name: 'Romance Clásico',
    category: 'Romance',
    description: 'Una historia de amor con obstáculos y reencuentros',
    icon: Heart,
    tags: ['romance', 'drama', 'emocional'],
    template: `{character1} y {character2} se conocieron en {location} hace {timeframe}. Después de {conflict}, se separaron sin una despedida apropiada. Ahora, el destino los vuelve a reunir en {newLocation}, pero las cosas han cambiado. {character1} ahora es {newSituation1} mientras que {character2} {newSituation2}. ¿Podrán superar {newObstacle} y encontrar el camino de vuelta el uno al otro?`,
    variables: ['character1', 'character2', 'location', 'timeframe', 'conflict', 'newLocation', 'newSituation1', 'newSituation2', 'newObstacle']
  },
  {
    id: 'mystery',
    name: 'Misterio Urbano',
    category: 'Misterio',
    description: 'Un enigma que desentrañar en la ciudad',
    icon: Telescope,
    tags: ['misterio', 'investigación', 'suspense'],
    template: `Una serie de {mysteriousEvents} han estado ocurriendo en {city}. {detective} es asignado al caso junto con {partner}, quien tiene un pasado conectado con {suspiciousLocation}. Mientras investigan, descubren que {clue1} lleva a {clue2}, pero cada respuesta trae más preguntas. El tiempo se agota cuando {urgentEvent} pone en peligro a {targetPerson}.`,
    variables: ['mysteriousEvents', 'city', 'detective', 'partner', 'suspiciousLocation', 'clue1', 'clue2', 'urgentEvent', 'targetPerson']
  },
  {
    id: 'fantasy',
    name: 'Aventura Fantástica',
    category: 'Fantasía',
    description: 'Una quest épica en un mundo mágico',
    icon: Crown,
    tags: ['fantasía', 'aventura', 'magia'],
    template: `En el reino de {kingdom}, una antigua {ancientThreat} ha despertado después de {timeSlept} años. {hero} debe emprender un viaje hacia {destination} para encontrar {magicalItem}, la única cosa capaz de {solution}. Acompañado por {companion1} y {companion2}, enfrentarán {challenge1}, {challenge2}, y finalmente {finalBoss} en {finalLocation}.`,
    variables: ['kingdom', 'ancientThreat', 'timeSlept', 'hero', 'destination', 'magicalItem', 'solution', 'companion1', 'companion2', 'challenge1', 'challenge2', 'finalBoss', 'finalLocation']
  },
  {
    id: 'horror',
    name: 'Terror Psicológico',
    category: 'Horror',
    description: 'Una experiencia aterradora que juega con la mente',
    icon: Ghost,
    tags: ['horror', 'psicológico', 'suspense'],
    template: `{protagonist} se muda a {hauntedLocation} después de {reason}. Al principio, solo hay {subtleSign1} y {subtleSign2}, pero pronto {escalation} comienza a manifestarse. {protagonist} descubre que {darkSecret} está conectado con {pastEvent}. Ahora debe {challengeToOvercome} antes de que {consequence} se haga realidad.`,
    variables: ['protagonist', 'hauntedLocation', 'reason', 'subtleSign1', 'subtleSign2', 'escalation', 'darkSecret', 'pastEvent', 'challengeToOvercome', 'consequence']
  },
  {
    id: 'scifi',
    name: 'Ciencia Ficción',
    category: 'Sci-Fi',
    description: 'Una historia futurista con tecnología avanzada',
    icon: Telescope,
    tags: ['ciencia ficción', 'futuro', 'tecnología'],
    template: `En el año {year}, {scientist} descubre {discovery} que podría cambiar {aspectOfLife} para siempre. Sin embargo, {corporation} quiere usar esta tecnología para {evilPurpose}. Con la ayuda de {ally}, {scientist} debe {mission} mientras evita {antagonist} y sus {threats}. El futuro de {stakes} depende de sus acciones.`,
    variables: ['year', 'scientist', 'discovery', 'aspectOfLife', 'corporation', 'evilPurpose', 'ally', 'mission', 'antagonist', 'threats', 'stakes']
  },
  {
    id: 'action',
    name: 'Acción y Aventura',
    category: 'Acción',
    description: 'Adrenalina pura con persecuciones y combates',
    icon: Sword,
    tags: ['acción', 'aventura', 'combate'],
    template: `{actionHero} es un ex-{profession} que ahora lleva una vida tranquila en {location}. Todo cambia cuando {incitingIncident} pone en peligro a {lovedOne}. Ahora debe usar sus habilidades de {skillSet} para infiltrarse en {enemyBase}, enfrentar a {villain} y sus {minions}, y completar {mission} antes de que {deadline} expire.`,
    variables: ['actionHero', 'profession', 'location', 'incitingIncident', 'lovedOne', 'skillSet', 'enemyBase', 'villain', 'minions', 'mission', 'deadline']
  }
];

const moods = ['Épico', 'Íntimo', 'Misterioso', 'Romántico', 'Tenso', 'Melancólico', 'Esperanzador', 'Oscuro'];
const difficulties = ['Principiante', 'Intermedio', 'Avanzado', 'Experto'];
const genres = ['Romance', 'Misterio', 'Fantasía', 'Horror', 'Sci-Fi', 'Acción', 'Drama', 'Comedia'];

export default function TramaGenerator() {
  const [selectedTemplate, setSelectedTemplate] = useState<TramaTemplate | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [variables, setVariables] = useState<{ [key: string]: string }>({});
  const [generatedTrama, setGeneratedTrama] = useState<GeneratedTrama | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('templates');

  const handleTemplateSelect = (template: TramaTemplate) => {
    setSelectedTemplate(template);
    const newVariables: { [key: string]: string } = {};
    template.variables.forEach(variable => {
      newVariables[variable] = '';
    });
    setVariables(newVariables);
  };

  const handleVariableChange = (variable: string, value: string) => {
    setVariables(prev => ({
      ...prev,
      [variable]: value
    }));
  };

  const generateFromTemplate = () => {
    if (!selectedTemplate) return;

    setIsGenerating(true);
    
    // Simular generación con IA
    setTimeout(() => {
      let filledTemplate = selectedTemplate.template;
      
      // Reemplazar variables con valores o generar valores aleatorios si están vacíos
      selectedTemplate.variables.forEach(variable => {
        const value = variables[variable] || generateRandomValue(variable);
        filledTemplate = filledTemplate.replace(new RegExp(`{${variable}}`, 'g'), value);
      });

      const generated: GeneratedTrama = {
        title: generateTitle(selectedTemplate),
        description: filledTemplate,
        opening: generateOpening(selectedTemplate),
        tags: [...selectedTemplate.tags, ...generateRandomTags()],
        mood: moods[Math.floor(Math.random() * moods.length)],
        difficulty: difficulties[Math.floor(Math.random() * difficulties.length)]
      };

      setGeneratedTrama(generated);
      setIsGenerating(false);
    }, 2000);
  };

  const generateFromPrompt = () => {
    if (!customPrompt.trim()) return;

    setIsGenerating(true);
    
    // Simular generación con IA basada en prompt
    setTimeout(() => {
      const genre = genres[Math.floor(Math.random() * genres.length)];
      const generated: GeneratedTrama = {
        title: generateTitleFromPrompt(customPrompt),
        description: generateDescriptionFromPrompt(customPrompt),
        opening: generateOpeningFromPrompt(customPrompt),
        tags: [genre.toLowerCase(), ...generateRandomTags()],
        mood: moods[Math.floor(Math.random() * moods.length)],
        difficulty: difficulties[Math.floor(Math.random() * difficulties.length)]
      };

      setGeneratedTrama(generated);
      setIsGenerating(false);
    }, 2000);
  };

  const generateRandomValue = (variable: string): string => {
    const randomValues: { [key: string]: string[] } = {
      character1: ['Alex', 'Morgan', 'Riley', 'Jordan', 'Casey'],
      character2: ['Sam', 'Taylor', 'Avery', 'Blake', 'Quinn'],
      location: ['un café', 'la universidad', 'un parque', 'una biblioteca', 'un museo'],
      timeframe: ['dos años', 'cinco años', 'una década', 'varios meses'],
      city: ['Nueva York', 'Londres', 'Tokio', 'París', 'Barcelona'],
      kingdom: ['Aethermoor', 'Valdoria', 'Crysthaven', 'Shadowmere', 'Thornwick'],
      year: ['2087', '2156', '2234', '2301', '2445']
    };

    const values = randomValues[variable] || ['[valor]'];
    return values[Math.floor(Math.random() * values.length)];
  };

  const generateTitle = (template: TramaTemplate): string => {
    const titles: { [key: string]: string[] } = {
      romance: ['Corazones Reunidos', 'El Amor Perdido', 'Segundas Oportunidades', 'Destinos Cruzados'],
      mystery: ['Sombras en la Ciudad', 'El Enigma de', 'Secretos Ocultos', 'La Verdad Detrás'],
      fantasy: ['La Búsqueda de', 'El Despertar de', 'Los Guardianes de', 'La Profecía'],
      horror: ['Susurros en la Oscuridad', 'La Casa de', 'Pesadillas Reales', 'El Terror de'],
      scifi: ['El Futuro de', 'Proyecto', 'La Era de', 'Revolución Digital'],
      action: ['Misión', 'La Venganza de', 'Operación', 'El Último']
    };

    const categoryTitles = titles[template.id] || ['Nueva Historia'];
    return categoryTitles[Math.floor(Math.random() * categoryTitles.length)];
  };

  const generateOpening = (template: TramaTemplate): string => {
    const openings: { [key: string]: string[] } = {
      romance: [
        'La lluvia golpeaba contra la ventana del café cuando sus miradas se encontraron...',
        'Había algo familiar en esa sonrisa, algo que despertó memorias dormidas...',
        'El tiempo parecía haberse detenido en ese momento perfecto...'
      ],
      mystery: [
        'La llamada llegó a las 3:17 AM, un número que cambiaría todo...',
        'El cuerpo fue encontrado exactamente donde la nota decía que estaría...',
        'Nadie esperaba que la verdad fuera tan perturbadora...'
      ],
      fantasy: [
        'Las estrellas se alinearon esa noche, tal como decía la antigua profecía...',
        'El dragón durmiente abrió un ojo por primera vez en mil años...',
        'La magia había regresado al mundo, y con ella, el caos...'
      ]
    };

    const categoryOpenings = openings[template.id] || ['Una nueva aventura estaba por comenzar...'];
    return categoryOpenings[Math.floor(Math.random() * categoryOpenings.length)];
  };

  const generateTitleFromPrompt = (prompt: string): string => {
    const words = prompt.split(' ');
    const keyWords = words.filter(word => word.length > 4);
    const randomWord = keyWords[Math.floor(Math.random() * keyWords.length)] || 'Historia';
    
    const prefixes = ['El Misterio de', 'La Historia de', 'El Secreto de', 'La Aventura de', 'El Destino de'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    
    return `${prefix} ${randomWord}`;
  };

  const generateDescriptionFromPrompt = (prompt: string): string => {
    return `Basándose en "${prompt}", esta historia explora temas profundos de identidad, destino y las decisiones que definen quiénes somos. Los personajes se enfrentarán a desafíos que pondrán a prueba no solo sus habilidades, sino también sus valores más fundamentales. A medida que la trama se desarrolla, secretos del pasado emergerán para cambiar todo lo que creían saber sobre su mundo y sobre sí mismos.`;
  };

  const generateOpeningFromPrompt = (prompt: string): string => {
    return `Todo comenzó con una simple observación que cambiaría el curso de los eventos. Lo que parecía ser una situación ordinaria pronto revelaría capas de complejidad que nadie había anticipado. En ese momento decisivo, los destinos de todos los involucrados quedaron entrelazados de manera irreversible...`;
  };

  const generateRandomTags = (): string[] => {
    const allTags = ['drama', 'aventura', 'misterio', 'romance', 'acción', 'fantasía', 'suspense', 'comedia'];
    const numTags = Math.floor(Math.random() * 3) + 1;
    const shuffled = allTags.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, numTags);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2 flex items-center justify-center gap-2">
          <Wand2 className="h-8 w-8 text-purple-500" />
          Generador de Tramas IA
        </h2>
        <p className="text-muted-foreground">
          Crea historias únicas con plantillas predefinidas o prompts personalizados
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Plantillas
          </TabsTrigger>
          <TabsTrigger value="prompt" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Prompt Libre
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates">
          {/* Selección de plantillas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tramaTemplates.map((template) => {
              const IconComponent = template.icon;
              return (
                <div 
                  key={template.id}
                  className="cursor-pointer transition-all hover:shadow-lg"
                  onClick={() => handleTemplateSelect(template)}
                >
                  <Card className={`${
                    selectedTemplate?.id === template.id ? 'ring-2 ring-purple-500' : ''
                  }`}>
                    <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <IconComponent className="h-5 w-5 text-purple-500" />
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      {template.description}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {template.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                </div>
              );
            })}
          </div>

          {/* Configuración de variables */}
          {selectedTemplate && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <selectedTemplate.icon className="h-5 w-5" />
                  Personalizar: {selectedTemplate.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedTemplate.variables.map((variable) => (
                    <div key={variable}>
                      <label className="text-sm font-medium capitalize">
                        {variable.replace(/([A-Z])/g, ' $1').toLowerCase()}
                      </label>
                      <Input
                        placeholder={`Ingresa ${variable} (opcional)`}
                        value={variables[variable] || ''}
                        onChange={(e) => handleVariableChange(variable, e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-between items-center pt-4">
                  <p className="text-sm text-muted-foreground">
                    Los campos vacíos se completarán automáticamente
                  </p>
                  <Button onClick={generateFromTemplate} disabled={isGenerating}>
                    {isGenerating ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Generando...
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4 mr-2" />
                        Generar Historia
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="prompt">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Generación por Prompt
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">
                  Describe tu idea para la historia
                </label>
                <Textarea
                  placeholder="Ej: Una historia sobre dos detectives que investigan una serie de crímenes en una ciudad futurista donde la tecnología ha cambiado la forma en que se cometen los delitos..."
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  className="mt-1 min-h-[100px]"
                />
              </div>
              
              <div className="flex justify-end">
                <Button 
                  onClick={generateFromPrompt} 
                  disabled={isGenerating || !customPrompt.trim()}
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generar con IA
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Resultado generado */}
      {generatedTrama && (
        <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-500" />
                Historia Generada
              </span>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => copyToClipboard(JSON.stringify(generatedTrama, null, 2))}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-xl font-bold mb-2">{generatedTrama.title}</h3>
              <div className="flex items-center gap-4 mb-4">
                <Badge variant="outline">{generatedTrama.mood}</Badge>
                <Badge variant="outline">{generatedTrama.difficulty}</Badge>
                <div className="flex gap-1">
                  {generatedTrama.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Descripción</h4>
              <p className="text-muted-foreground leading-relaxed">
                {generatedTrama.description}
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Apertura Sugerida</h4>
              <p className="text-muted-foreground leading-relaxed italic">
                {generatedTrama.opening}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
