import { useState } from 'react';
import {
  Paper,
  Typography,
  Box,
  Button,
  ButtonGroup,
  TextField,
  FormControlLabel,
  Checkbox,
  List,
  ListItem,
  ListItemText,
  Chip,
  IconButton,
  Collapse,
} from '@mui/material';
import {
  Casino as DiceIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';

interface DiceRollResult {
  formula: string;
  result: number;
  rolls: number[];
  modifier: number;
  advantage?: boolean;
  disadvantage?: boolean;
  timestamp: Date;
}

interface DiceRollerProps {
  onRoll?: (roll: DiceRollResult) => void;
  compact?: boolean;
}

const DiceRoller = ({ onRoll, compact = false }: DiceRollerProps) => {
  const [formula, setFormula] = useState('1d20');
  const [modifier, setModifier] = useState(0);
  const [advantage, setAdvantage] = useState(false);
  const [disadvantage, setDisadvantage] = useState(false);
  const [history, setHistory] = useState<DiceRollResult[]>([]);
  const [showHistory, setShowHistory] = useState(true);

  const commonDice = [
    { label: 'd4', sides: 4 },
    { label: 'd6', sides: 6 },
    { label: 'd8', sides: 8 },
    { label: 'd10', sides: 10 },
    { label: 'd12', sides: 12 },
    { label: 'd20', sides: 20 },
    { label: 'd100', sides: 100 },
  ];

  const rollDice = (sides: number, count: number = 1): number[] => {
    return Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
  };

  const parseDiceFormula = (formula: string): { count: number; sides: number } | null => {
    const match = formula.match(/^(\d+)?d(\d+)$/i);
    if (!match) return null;
    return {
      count: parseInt(match[1] || '1'),
      sides: parseInt(match[2]),
    };
  };

  const handleRoll = () => {
    const parsed = parseDiceFormula(formula);
    if (!parsed) {
      alert('Invalid dice formula. Use format like "1d20" or "2d6"');
      return;
    }

    let rolls: number[] = [];
    let finalResult: number;

    if (advantage || disadvantage) {
      // Roll twice for advantage/disadvantage
      const roll1 = rollDice(parsed.sides, parsed.count);
      const roll2 = rollDice(parsed.sides, parsed.count);
      const sum1 = roll1.reduce((a, b) => a + b, 0);
      const sum2 = roll2.reduce((a, b) => a + b, 0);

      if (advantage) {
        finalResult = Math.max(sum1, sum2) + modifier;
        rolls = sum1 > sum2 ? roll1 : roll2;
      } else {
        finalResult = Math.min(sum1, sum2) + modifier;
        rolls = sum1 < sum2 ? roll1 : roll2;
      }
    } else {
      rolls = rollDice(parsed.sides, parsed.count);
      finalResult = rolls.reduce((a, b) => a + b, 0) + modifier;
    }

    const result: DiceRollResult = {
      formula,
      result: finalResult,
      rolls,
      modifier,
      advantage,
      disadvantage,
      timestamp: new Date(),
    };

    setHistory((prev) => [result, ...prev.slice(0, 19)]); // Keep last 20 rolls
    onRoll?.(result);
  };

  const quickRoll = (sides: number) => {
    setFormula(`1d${sides}`);
    setTimeout(() => {
      const rolls = rollDice(sides);
      const result: DiceRollResult = {
        formula: `1d${sides}`,
        result: rolls[0] + modifier,
        rolls,
        modifier,
        timestamp: new Date(),
      };
      setHistory((prev) => [result, ...prev.slice(0, 19)]);
      onRoll?.(result);
    }, 100);
  };

  if (compact) {
    return (
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {commonDice.map((dice) => (
          <Button
            key={dice.label}
            variant="outlined"
            size="small"
            onClick={() => quickRoll(dice.sides)}
            startIcon={<DiceIcon />}
          >
            {dice.label}
          </Button>
        ))}
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Dice Roller
      </Typography>

      {/* Quick Dice Buttons */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
          Quick Roll
        </Typography>
        <ButtonGroup size="small" variant="outlined">
          {commonDice.map((dice) => (
            <Button key={dice.label} onClick={() => quickRoll(dice.sides)}>
              {dice.label}
            </Button>
          ))}
        </ButtonGroup>
      </Box>

      {/* Custom Formula */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
          Custom Formula
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
          <TextField
            size="small"
            value={formula}
            onChange={(e) => setFormula(e.target.value)}
            placeholder="1d20"
            sx={{ width: 100 }}
          />
          <TextField
            size="small"
            type="number"
            value={modifier}
            onChange={(e) => setModifier(parseInt(e.target.value) || 0)}
            placeholder="Modifier"
            sx={{ width: 100 }}
          />
          <Button variant="contained" onClick={handleRoll} startIcon={<DiceIcon />}>
            Roll
          </Button>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={advantage}
                onChange={(e) => {
                  setAdvantage(e.target.checked);
                  if (e.target.checked) setDisadvantage(false);
                }}
              />
            }
            label="Advantage"
          />
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={disadvantage}
                onChange={(e) => {
                  setDisadvantage(e.target.checked);
                  if (e.target.checked) setAdvantage(false);
                }}
              />
            }
            label="Disadvantage"
          />
        </Box>
      </Box>

      {/* Roll History */}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="subtitle2">Roll History</Typography>
          <IconButton size="small" onClick={() => setShowHistory(!showHistory)}>
            {showHistory ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
        <Collapse in={showHistory}>
          <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
            {history.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                No rolls yet
              </Typography>
            ) : (
              history.map((roll, index) => (
                <ListItem
                  key={index}
                  sx={{
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1,
                    mb: 0.5,
                  }}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" fontWeight="bold">
                          {roll.formula}
                          {roll.modifier !== 0 && ` ${roll.modifier >= 0 ? '+' : ''}${roll.modifier}`}
                        </Typography>
                        <Chip label={roll.result} size="small" color="primary" />
                        {roll.advantage && <Chip label="ADV" size="small" color="success" />}
                        {roll.disadvantage && <Chip label="DIS" size="small" color="error" />}
                      </Box>
                    }
                    secondary={
                      <Typography variant="caption">
                        Rolls: [{roll.rolls.join(', ')}]
                      </Typography>
                    }
                  />
                </ListItem>
              ))
            )}
          </List>
        </Collapse>
      </Box>
    </Paper>
  );
};

export default DiceRoller;

// Made with Bob
