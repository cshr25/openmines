# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OpenMines is a Python-based simulation environment for truck dispatching in mining operations. It provides a framework to model mining scenarios and evaluate different dispatching algorithms through discrete event simulation.

## Key Commands

### Running Simulations
```bash
# Run simulation with config file
openmines -f config.json
# or
openmines run -f config.json

# Visualize results
openmines -v result.json
# or
openmines visualize -f result.json

# Analyze simulation logs
openmines -a logs/
openmines analyze logs/ -d DispatcherName
```

### Testing and Development
```bash
# Run tests (from test/ directory)
python test_ppo.py
python dqn.py

# Install in development mode
pip install -e .
```

### Ablation Experiments
```bash
# Single scene fleet ablation
openmines scene_based_fleet_ablation -f config.json -m 10 -M 50

# Multi-scene algorithm comparison
openmines algo_based_fleet_ablation -d configs/ -b NaiveDispatcher -t TargetDispatcher -m 10 -M 100
```

## Architecture Overview

### Core Components

**Mine Simulation (`src/mine.py`)**: Central orchestrator managing the discrete event simulation using SimPy. Coordinates all entities and maintains global state.

**Dispatching System**: 
- `src/dispatcher.py`: Base dispatcher interface defining `give_init_order`, `give_haul_order`, `give_back_order` methods
- `src/dispatch_algorithms/`: Collection of dispatching strategies (naive, nearest, optimize, PPO-based, etc.)

**Physical Entities**:
- `src/truck.py`: Truck objects with capacity, speed, and state management
- `src/load_site.py`: Loading locations with shovels and parking lots
- `src/dump_site.py`: Dumping locations with dumpers
- `src/charging_site.py`: Truck depot and initial positioning
- `src/road.py`: Road network with distance matrices and repair events

**Utilities**:
- `src/utils/event.py`: Event system for probabilistic mine events
- `src/utils/visualization/`: Visualization tools for charts and animations
- `src/utils/gym/`: OpenAI Gym integration for reinforcement learning
- `src/utils/analyzer.py`: Log analysis with LLM integration

### Configuration System

Mine scenarios are defined in JSON files (see `src/conf/` for examples). Key sections:
- `mine`: Basic mine information
- `charging_site`: Truck fleet definition with types, counts, capacities
- `load_sites`: Loading locations with shovels and cycle times
- `dump_sites`: Dumping locations with dumpers
- `road`: Distance matrices and travel times
- `dispatcher`: List of algorithms to compare

### Reinforcement Learning Integration

The system integrates with OpenAI Gym standard:
- Environment: `src/utils/gym/openmines_gym/envs/mine_env.py`
- Action space: Discrete dispatching decisions
- Observation space: Mine state features
- Two reward schemes: dense and sparse

## Development Patterns

### Creating New Dispatchers

Inherit from `BaseDispatcher` and implement:
```python
class MyDispatcher(BaseDispatcher):
    def give_init_order(self, truck: "Truck", mine: "Mine") -> int:
        # Return load site index for initial assignment
        
    def give_haul_order(self, truck: "Truck", mine: "Mine") -> int:
        # Return load site index for loaded truck
        
    def give_back_order(self, truck: "Truck", mine: "Mine") -> int:
        # Return dump site index for loaded truck
```

### Key Objects Available in Dispatchers

- `mine.load_sites`: List of LoadSite objects with queue info
- `mine.dump_sites`: List of DumpSite objects  
- `mine.trucks`: All truck objects with current states
- `mine.road`: Road network with distance matrices
- `truck.position`, `truck.load`, `truck.capacity`: Truck state
- `load_site.estimated_queue_wait_time`: Queue predictions

### File Structure

```
openmines/src/
├── cli/run.py              # Command-line interface and main entry point
├── mine.py                 # Core simulation engine
├── dispatcher.py           # Base dispatcher interface
├── dispatch_algorithms/    # All dispatching strategies
├── truck.py, load_site.py, dump_site.py, road.py  # Physical entities
├── utils/
│   ├── gym/               # RL environment integration
│   ├── visualization/     # Charts and animation tools
│   └── analyzer.py        # Log analysis utilities
└── conf/                  # Example configurations
```

Results are saved to `$CWD/result/` with tick data, performance charts, and analysis reports.