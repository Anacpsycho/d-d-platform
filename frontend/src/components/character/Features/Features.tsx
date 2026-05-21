import { Paper, Typography, Box, Chip, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { CharacterSheet } from '../../../types/character.types';

interface FeaturesProps {
  character: CharacterSheet;
}

const Features = ({ character }: FeaturesProps) => {
  const allFeatures = [...(character.features || []), ...(character.feats || [])];

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Features & Traits
      </Typography>

      {/* Proficiencies */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Proficiencies
        </Typography>
        
        {character.languages && character.languages.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
              Languages
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {character.languages.map((lang, index) => (
                <Chip key={index} label={lang} size="small" variant="outlined" />
              ))}
            </Box>
          </Box>
        )}

        {character.armorProficiencies && character.armorProficiencies.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
              Armor
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {character.armorProficiencies.map((armor, index) => (
                <Chip key={index} label={armor} size="small" variant="outlined" />
              ))}
            </Box>
          </Box>
        )}

        {character.weaponProficiencies && character.weaponProficiencies.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
              Weapons
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {character.weaponProficiencies.map((weapon, index) => (
                <Chip key={index} label={weapon} size="small" variant="outlined" />
              ))}
            </Box>
          </Box>
        )}

        {character.toolProficiencies && character.toolProficiencies.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
              Tools
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {character.toolProficiencies.map((tool, index) => (
                <Chip key={index} label={tool} size="small" variant="outlined" />
              ))}
            </Box>
          </Box>
        )}
      </Box>

      {/* Features & Traits */}
      <Box>
        <Typography variant="subtitle2" gutterBottom>
          Features & Traits ({allFeatures.length})
        </Typography>
        
        {allFeatures.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
            No features or traits
          </Typography>
        ) : (
          <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
            {allFeatures.map((feature, index) => (
              <Accordion key={index} sx={{ mb: 1 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                    <Typography variant="body2" sx={{ flex: 1 }}>
                      {feature.name}
                    </Typography>
                    {feature.uses && (
                      <Chip
                        label={`${feature.uses.current}/${feature.uses.max}`}
                        size="small"
                        color={feature.uses.current > 0 ? 'primary' : 'default'}
                      />
                    )}
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                    Source: {feature.source}
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {feature.description}
                  </Typography>
                  {feature.uses && (
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                      Resets on: {feature.uses.resetOn}
                    </Typography>
                  )}
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        )}
      </Box>

      {/* Character Details */}
      {(character.personality || character.ideals || character.bonds || character.flaws) && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Personality
          </Typography>
          {character.personality && (
            <Box sx={{ mb: 1 }}>
              <Typography variant="caption" color="text.secondary">Personality Traits</Typography>
              <Typography variant="body2">{character.personality}</Typography>
            </Box>
          )}
          {character.ideals && (
            <Box sx={{ mb: 1 }}>
              <Typography variant="caption" color="text.secondary">Ideals</Typography>
              <Typography variant="body2">{character.ideals}</Typography>
            </Box>
          )}
          {character.bonds && (
            <Box sx={{ mb: 1 }}>
              <Typography variant="caption" color="text.secondary">Bonds</Typography>
              <Typography variant="body2">{character.bonds}</Typography>
            </Box>
          )}
          {character.flaws && (
            <Box sx={{ mb: 1 }}>
              <Typography variant="caption" color="text.secondary">Flaws</Typography>
              <Typography variant="body2">{character.flaws}</Typography>
            </Box>
          )}
        </Box>
      )}
    </Paper>
  );
};

export default Features;

// Made with Bob
