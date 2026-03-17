import {
  ActionIcon,
  Badge,
  Button,
  Divider,
  Grid,
  Group,
  NumberInput,
  Select,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { IconPlus, IconTrash } from "@tabler/icons-react";

import type { GuidedRulesetEditorState } from "../../pages/landing/rulesets/rulesetEditorForm";
import {
  TIEBREAKER_OPTIONS,
  createLocalId,
  matchFormatTypeOptions,
  numberInputValue,
  participantSourceOptions,
  removeByLocalId,
  scoringSystemTypeOptions,
  stageTypeOptions,
} from "../../pages/landing/rulesets/rulesetEditorForm";
import { AppSurface } from "../common/AppSurface";

type RulesetGuidedEditorProps = {
  state: GuidedRulesetEditorState;
  onChange: (next: GuidedRulesetEditorState) => void;
};

export function RulesetGuidedEditor({
  state,
  onChange,
}: RulesetGuidedEditorProps) {
  const matchFormatOptions = state.matchFormats
    .filter((item) => item.key.trim().length > 0)
    .map((item) => ({ value: item.key.trim(), label: item.key.trim() }));

  const scoringSystemOptions = state.scoringSystems
    .filter((item) => item.key.trim().length > 0)
    .map((item) => ({ value: item.key.trim(), label: item.key.trim() }));

  const stageOptions = state.stages
    .filter((stage) => stage.id.trim().length > 0)
    .map((stage) => ({
      value: stage.id.trim(),
      label: stage.name.trim() || stage.id.trim(),
    }));

  return (
    <Stack gap="md" pr="xs">
      <AppSurface p="md">
        <Stack gap="sm">
          <Title order={5}>General</Title>
          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <NumberInput
                label="Version"
                min={1}
                value={state.version}
                onChange={(value) =>
                  onChange({
                    ...state,
                    version: typeof value === "number" ? value : 1,
                  })
                }
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <NumberInput
                label="Default round duration (days)"
                min={1}
                value={numberInputValue(state.defaultRoundDurationDays)}
                onChange={(value) =>
                  onChange({
                    ...state,
                    defaultRoundDurationDays:
                      typeof value === "number" ? value : null,
                  })
                }
              />
            </Grid.Col>
          </Grid>
        </Stack>
      </AppSurface>

      <AppSurface p="md">
        <Stack gap="sm">
          <Group justify="space-between">
            <Title order={5}>Available Match Formats</Title>
            <Button
              size="xs"
              leftSection={<IconPlus size={14} />}
              onClick={() =>
                onChange({
                  ...state,
                  matchFormats: [
                    ...state.matchFormats,
                    {
                      localId: createLocalId("fmt"),
                      key: "",
                      type: "best_of",
                      games: 3,
                    },
                  ],
                })
              }
            >
              Add format
            </Button>
          </Group>

          {state.matchFormats.map((format) => (
            <AppSurface key={format.localId} p="sm">
              <Grid align="end">
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <TextInput
                    label="Format key"
                    placeholder="bo3"
                    value={format.key}
                    onChange={(event) =>
                      onChange({
                        ...state,
                        matchFormats: state.matchFormats.map((item) =>
                          item.localId === format.localId
                            ? { ...item, key: event.currentTarget.value }
                            : item,
                        ),
                      })
                    }
                  />
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 4 }}>
                  <Select
                    label="Type"
                    data={matchFormatTypeOptions()}
                    value={format.type}
                    onChange={(value) =>
                      onChange({
                        ...state,
                        matchFormats: state.matchFormats.map((item) =>
                          item.localId === format.localId && value
                            ? { ...item, type: value as "best_of" | "play_all" }
                            : item,
                        ),
                      })
                    }
                  />
                </Grid.Col>

                <Grid.Col span={{ base: 10, md: 3 }}>
                  <NumberInput
                    label="Games"
                    min={1}
                    value={format.games}
                    onChange={(value) =>
                      onChange({
                        ...state,
                        matchFormats: state.matchFormats.map((item) =>
                          item.localId === format.localId
                            ? {
                                ...item,
                                games: typeof value === "number" ? value : 1,
                              }
                            : item,
                        ),
                      })
                    }
                  />
                </Grid.Col>

                <Grid.Col span={{ base: 2, md: 1 }}>
                  <ActionIcon
                    color="red"
                    variant="light"
                    onClick={() =>
                      onChange({
                        ...state,
                        matchFormats: removeByLocalId(
                          state.matchFormats,
                          format.localId,
                        ),
                      })
                    }
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </Grid.Col>
              </Grid>
            </AppSurface>
          ))}
        </Stack>
      </AppSurface>

      <AppSurface p="md">
        <Stack gap="sm">
          <Group justify="space-between">
            <Title order={5}>Scoring Systems</Title>
            <Button
              size="xs"
              leftSection={<IconPlus size={14} />}
              onClick={() =>
                onChange({
                  ...state,
                  scoringSystems: [
                    ...state.scoringSystems,
                    {
                      localId: createLocalId("score"),
                      key: "",
                      type: "match_points",
                      win: 3,
                      draw: 0,
                      loss: 0,
                    },
                  ],
                })
              }
            >
              Add scoring
            </Button>
          </Group>

          {state.scoringSystems.map((system) => (
            <AppSurface key={system.localId} p="sm">
              <Stack gap="sm">
                <Grid align="end">
                  <Grid.Col span={{ base: 12, md: 5 }}>
                    <TextInput
                      label="Scoring key"
                      placeholder="league_points"
                      value={system.key}
                      onChange={(event) =>
                        onChange({
                          ...state,
                          scoringSystems: state.scoringSystems.map((item) =>
                            item.localId === system.localId
                              ? { ...item, key: event.currentTarget.value }
                              : item,
                          ),
                        })
                      }
                    />
                  </Grid.Col>

                  <Grid.Col span={{ base: 10, md: 6 }}>
                    <Select
                      label="Type"
                      data={scoringSystemTypeOptions()}
                      value={system.type}
                      onChange={(value) => {
                        if (!value) return;

                        onChange({
                          ...state,
                          scoringSystems: state.scoringSystems.map((item) => {
                            if (item.localId !== system.localId) return item;

                            if (value === "match_points") {
                              return {
                                localId: item.localId,
                                key: item.key,
                                type: "match_points",
                                win: 3,
                                draw: 0,
                                loss: 0,
                              };
                            }

                            if (value === "game_points") {
                              return {
                                localId: item.localId,
                                key: item.key,
                                type: "game_points",
                                per_game_win: 1,
                                per_game_loss: 0,
                              };
                            }

                            return {
                              localId: item.localId,
                              key: item.key,
                              type: "hybrid",
                              match_win: 3,
                              match_loss: 0,
                              game_win: 1,
                              game_loss: 0,
                            };
                          }),
                        });
                      }}
                    />
                  </Grid.Col>

                  <Grid.Col span={{ base: 2, md: 1 }}>
                    <ActionIcon
                      color="red"
                      variant="light"
                      onClick={() =>
                        onChange({
                          ...state,
                          scoringSystems: removeByLocalId(
                            state.scoringSystems,
                            system.localId,
                          ),
                        })
                      }
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Grid.Col>
                </Grid>

                {system.type === "match_points" ? (
                  <Grid>
                    <Grid.Col span={{ base: 12, md: 4 }}>
                      <NumberInput
                        label="Win"
                        value={system.win}
                        onChange={(value) =>
                          onChange({
                            ...state,
                            scoringSystems: state.scoringSystems.map((item) =>
                              item.localId === system.localId &&
                              item.type === "match_points"
                                ? {
                                    ...item,
                                    win: typeof value === "number" ? value : 0,
                                  }
                                : item,
                            ),
                          })
                        }
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, md: 4 }}>
                      <NumberInput
                        label="Draw"
                        value={system.draw}
                        onChange={(value) =>
                          onChange({
                            ...state,
                            scoringSystems: state.scoringSystems.map((item) =>
                              item.localId === system.localId &&
                              item.type === "match_points"
                                ? {
                                    ...item,
                                    draw: typeof value === "number" ? value : 0,
                                  }
                                : item,
                            ),
                          })
                        }
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, md: 4 }}>
                      <NumberInput
                        label="Loss"
                        value={system.loss}
                        onChange={(value) =>
                          onChange({
                            ...state,
                            scoringSystems: state.scoringSystems.map((item) =>
                              item.localId === system.localId &&
                              item.type === "match_points"
                                ? {
                                    ...item,
                                    loss: typeof value === "number" ? value : 0,
                                  }
                                : item,
                            ),
                          })
                        }
                      />
                    </Grid.Col>
                  </Grid>
                ) : null}

                {system.type === "game_points" ? (
                  <Grid>
                    <Grid.Col span={{ base: 12, md: 6 }}>
                      <NumberInput
                        label="Per-game win"
                        value={system.per_game_win}
                        onChange={(value) =>
                          onChange({
                            ...state,
                            scoringSystems: state.scoringSystems.map((item) =>
                              item.localId === system.localId &&
                              item.type === "game_points"
                                ? {
                                    ...item,
                                    per_game_win:
                                      typeof value === "number" ? value : 0,
                                  }
                                : item,
                            ),
                          })
                        }
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, md: 6 }}>
                      <NumberInput
                        label="Per-game loss"
                        value={system.per_game_loss}
                        onChange={(value) =>
                          onChange({
                            ...state,
                            scoringSystems: state.scoringSystems.map((item) =>
                              item.localId === system.localId &&
                              item.type === "game_points"
                                ? {
                                    ...item,
                                    per_game_loss:
                                      typeof value === "number" ? value : 0,
                                  }
                                : item,
                            ),
                          })
                        }
                      />
                    </Grid.Col>
                  </Grid>
                ) : null}

                {system.type === "hybrid" ? (
                  <Grid>
                    <Grid.Col span={{ base: 12, md: 3 }}>
                      <NumberInput
                        label="Match win"
                        value={system.match_win}
                        onChange={(value) =>
                          onChange({
                            ...state,
                            scoringSystems: state.scoringSystems.map((item) =>
                              item.localId === system.localId &&
                              item.type === "hybrid"
                                ? {
                                    ...item,
                                    match_win:
                                      typeof value === "number" ? value : 0,
                                  }
                                : item,
                            ),
                          })
                        }
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, md: 3 }}>
                      <NumberInput
                        label="Match loss"
                        value={system.match_loss}
                        onChange={(value) =>
                          onChange({
                            ...state,
                            scoringSystems: state.scoringSystems.map((item) =>
                              item.localId === system.localId &&
                              item.type === "hybrid"
                                ? {
                                    ...item,
                                    match_loss:
                                      typeof value === "number" ? value : 0,
                                  }
                                : item,
                            ),
                          })
                        }
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, md: 3 }}>
                      <NumberInput
                        label="Game win"
                        value={system.game_win}
                        onChange={(value) =>
                          onChange({
                            ...state,
                            scoringSystems: state.scoringSystems.map((item) =>
                              item.localId === system.localId &&
                              item.type === "hybrid"
                                ? {
                                    ...item,
                                    game_win:
                                      typeof value === "number" ? value : 0,
                                  }
                                : item,
                            ),
                          })
                        }
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, md: 3 }}>
                      <NumberInput
                        label="Game loss"
                        value={system.game_loss}
                        onChange={(value) =>
                          onChange({
                            ...state,
                            scoringSystems: state.scoringSystems.map((item) =>
                              item.localId === system.localId &&
                              item.type === "hybrid"
                                ? {
                                    ...item,
                                    game_loss:
                                      typeof value === "number" ? value : 0,
                                  }
                                : item,
                            ),
                          })
                        }
                      />
                    </Grid.Col>
                  </Grid>
                ) : null}
              </Stack>
            </AppSurface>
          ))}
        </Stack>
      </AppSurface>

      <AppSurface p="md">
        <Stack gap="sm">
          <Group justify="space-between">
            <Title order={5}>Stages</Title>
            <Button
              size="xs"
              leftSection={<IconPlus size={14} />}
              onClick={() =>
                onChange({
                  ...state,
                  stages: [
                    ...state.stages,
                    {
                      localId: createLocalId("stage"),
                      id: "",
                      name: "",
                      type: "round_robin",
                      participantSource: "division_players",
                      participantStageId: "",
                      participantSelectorType: "top_n",
                      participantSelectorCount: 4,
                      cadenceDays: state.defaultRoundDurationDays,
                      defaultFormat: state.matchFormats[0]?.key ?? "",
                      overrides: [],
                      advancementType: "",
                      advancementCount: null,
                      seedingType: "",
                      roundRobinLegs: 1,
                      scoringSystem: state.scoringSystems[0]?.key ?? "",
                      tiebreakers: [],
                    },
                  ],
                })
              }
            >
              Add stage
            </Button>
          </Group>

          {state.stages.map((stage, stageIndex) => (
            <AppSurface key={stage.localId} p="sm">
              <Stack gap="sm">
                <Group justify="space-between">
                  <Group gap="xs">
                    <Badge variant="light" color="gold">
                      Stage {stageIndex + 1}
                    </Badge>
                    <Text fw={600}>{stage.name || "Untitled stage"}</Text>
                  </Group>

                  <ActionIcon
                    color="red"
                    variant="light"
                    onClick={() =>
                      onChange({
                        ...state,
                        stages: removeByLocalId(state.stages, stage.localId),
                      })
                    }
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </Group>

                <Grid>
                  <Grid.Col span={{ base: 12, md: 4 }}>
                    <TextInput
                      label="Stage ID"
                      placeholder="group_stage"
                      value={stage.id}
                      onChange={(event) =>
                        onChange({
                          ...state,
                          stages: state.stages.map((item) =>
                            item.localId === stage.localId
                              ? { ...item, id: event.currentTarget.value }
                              : item,
                          ),
                        })
                      }
                    />
                  </Grid.Col>

                  <Grid.Col span={{ base: 12, md: 4 }}>
                    <TextInput
                      label="Stage name"
                      placeholder="Group Stage"
                      value={stage.name}
                      onChange={(event) =>
                        onChange({
                          ...state,
                          stages: state.stages.map((item) =>
                            item.localId === stage.localId
                              ? { ...item, name: event.currentTarget.value }
                              : item,
                          ),
                        })
                      }
                    />
                  </Grid.Col>

                  <Grid.Col span={{ base: 12, md: 4 }}>
                    <Select
                      label="Stage type"
                      data={stageTypeOptions()}
                      value={stage.type}
                      onChange={(value) =>
                        onChange({
                          ...state,
                          stages: state.stages.map((item) =>
                            item.localId === stage.localId && value
                              ? {
                                  ...item,
                                  type: value as
                                    | "round_robin"
                                    | "single_elimination"
                                    | "double_elimination",
                                }
                              : item,
                          ),
                        })
                      }
                    />
                  </Grid.Col>
                </Grid>

                <Divider />

                <Title order={6}>Participants</Title>

                <Grid>
                  <Grid.Col span={{ base: 12, md: 4 }}>
                    <Select
                      label="Source"
                      data={participantSourceOptions()}
                      value={stage.participantSource}
                      onChange={(value) =>
                        onChange({
                          ...state,
                          stages: state.stages.map((item) =>
                            item.localId === stage.localId && value
                              ? {
                                  ...item,
                                  participantSource: value as
                                    | "division_players"
                                    | "previous_stage",
                                }
                              : item,
                          ),
                        })
                      }
                    />
                  </Grid.Col>

                  {stage.participantSource === "previous_stage" ? (
                    <>
                      <Grid.Col span={{ base: 12, md: 4 }}>
                        <Select
                          label="Previous stage"
                          data={stageOptions.filter(
                            (option) => option.value !== stage.id,
                          )}
                          value={stage.participantStageId}
                          onChange={(value) =>
                            onChange({
                              ...state,
                              stages: state.stages.map((item) =>
                                item.localId === stage.localId
                                  ? { ...item, participantStageId: value ?? "" }
                                  : item,
                              ),
                            })
                          }
                        />
                      </Grid.Col>

                      <Grid.Col span={{ base: 12, md: 2 }}>
                        <TextInput
                          label="Selector type"
                          placeholder="top_n"
                          value={stage.participantSelectorType}
                          onChange={(event) =>
                            onChange({
                              ...state,
                              stages: state.stages.map((item) =>
                                item.localId === stage.localId
                                  ? {
                                      ...item,
                                      participantSelectorType:
                                        event.currentTarget.value,
                                    }
                                  : item,
                              ),
                            })
                          }
                        />
                      </Grid.Col>

                      <Grid.Col span={{ base: 12, md: 2 }}>
                        <NumberInput
                          label="Selector count"
                          min={1}
                          value={numberInputValue(
                            stage.participantSelectorCount,
                          )}
                          onChange={(value) =>
                            onChange({
                              ...state,
                              stages: state.stages.map((item) =>
                                item.localId === stage.localId
                                  ? {
                                      ...item,
                                      participantSelectorCount:
                                        typeof value === "number"
                                          ? value
                                          : null,
                                    }
                                  : item,
                              ),
                            })
                          }
                        />
                      </Grid.Col>
                    </>
                  ) : null}
                </Grid>

                <Divider />

                <Title order={6}>Match and schedule</Title>

                <Grid>
                  <Grid.Col span={{ base: 12, md: 4 }}>
                    <Select
                      label="Default match format"
                      data={matchFormatOptions}
                      value={stage.defaultFormat}
                      onChange={(value) =>
                        onChange({
                          ...state,
                          stages: state.stages.map((item) =>
                            item.localId === stage.localId
                              ? { ...item, defaultFormat: value ?? "" }
                              : item,
                          ),
                        })
                      }
                    />
                  </Grid.Col>

                  <Grid.Col span={{ base: 12, md: 4 }}>
                    <NumberInput
                      label="Round duration (days)"
                      min={1}
                      value={numberInputValue(stage.cadenceDays)}
                      onChange={(value) =>
                        onChange({
                          ...state,
                          stages: state.stages.map((item) =>
                            item.localId === stage.localId
                              ? {
                                  ...item,
                                  cadenceDays:
                                    typeof value === "number" ? value : null,
                                }
                              : item,
                          ),
                        })
                      }
                    />
                  </Grid.Col>

                  {stage.type === "round_robin" ? (
                    <Grid.Col span={{ base: 12, md: 4 }}>
                      <NumberInput
                        label="Legs"
                        min={1}
                        value={stage.roundRobinLegs}
                        onChange={(value) =>
                          onChange({
                            ...state,
                            stages: state.stages.map((item) =>
                              item.localId === stage.localId
                                ? {
                                    ...item,
                                    roundRobinLegs:
                                      typeof value === "number" ? value : 1,
                                  }
                                : item,
                            ),
                          })
                        }
                      />
                    </Grid.Col>
                  ) : null}
                </Grid>

                {stage.type === "round_robin" ? (
                  <Grid>
                    <Grid.Col span={{ base: 12, md: 6 }}>
                      <Select
                        label="Scoring system"
                        data={scoringSystemOptions}
                        value={stage.scoringSystem}
                        onChange={(value) =>
                          onChange({
                            ...state,
                            stages: state.stages.map((item) =>
                              item.localId === stage.localId
                                ? { ...item, scoringSystem: value ?? "" }
                                : item,
                            ),
                          })
                        }
                      />
                    </Grid.Col>

                    <Grid.Col span={{ base: 12, md: 6 }}>
                      <Select
                        label="Seeding"
                        placeholder="Optional"
                        data={[
                          {
                            value: "previous_stage_rank",
                            label: "Previous stage rank",
                          },
                        ]}
                        clearable
                        value={stage.seedingType || null}
                        onChange={(value) =>
                          onChange({
                            ...state,
                            stages: state.stages.map((item) =>
                              item.localId === stage.localId
                                ? { ...item, seedingType: value ?? "" }
                                : item,
                            ),
                          })
                        }
                      />
                    </Grid.Col>

                    <Grid.Col span={12}>
                      <Text size="sm" fw={500} mb={6}>
                        Tiebreakers
                      </Text>
                      <Group gap="xs">
                        {TIEBREAKER_OPTIONS.map((option) => {
                          const active = stage.tiebreakers.includes(option.value);
                          return (
                            <Button
                              key={option.value}
                              size="xs"
                              variant={active ? "filled" : "light"}
                              color={active ? "gold" : "gray"}
                              onClick={() =>
                                onChange({
                                  ...state,
                                  stages: state.stages.map((item) => {
                                    if (item.localId !== stage.localId) {
                                      return item;
                                    }

                                    const exists = item.tiebreakers.includes(
                                      option.value,
                                    );

                                    return {
                                      ...item,
                                      tiebreakers: exists
                                        ? item.tiebreakers.filter(
                                            (v) => v !== option.value,
                                          )
                                        : [...item.tiebreakers, option.value],
                                    };
                                  }),
                                })
                              }
                            >
                              {option.label}
                            </Button>
                          );
                        })}
                      </Group>
                    </Grid.Col>
                  </Grid>
                ) : (
                  <Grid>
                    <Grid.Col span={{ base: 12, md: 6 }}>
                      <Select
                        label="Seeding"
                        placeholder="Optional"
                        data={[
                          {
                            value: "previous_stage_rank",
                            label: "Previous stage rank",
                          },
                        ]}
                        clearable
                        value={stage.seedingType || null}
                        onChange={(value) =>
                          onChange({
                            ...state,
                            stages: state.stages.map((item) =>
                              item.localId === stage.localId
                                ? { ...item, seedingType: value ?? "" }
                                : item,
                            ),
                          })
                        }
                      />
                    </Grid.Col>
                  </Grid>
                )}

                <Divider />

                <Title order={6}>Advancement</Title>

                <Grid>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput
                      label="Advancement type"
                      placeholder="top_n"
                      value={stage.advancementType}
                      onChange={(event) =>
                        onChange({
                          ...state,
                          stages: state.stages.map((item) =>
                            item.localId === stage.localId
                              ? {
                                  ...item,
                                  advancementType: event.currentTarget.value,
                                }
                              : item,
                          ),
                        })
                      }
                    />
                  </Grid.Col>

                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <NumberInput
                      label="Advancement count"
                      min={1}
                      value={numberInputValue(stage.advancementCount)}
                      onChange={(value) =>
                        onChange({
                          ...state,
                          stages: state.stages.map((item) =>
                            item.localId === stage.localId
                              ? {
                                  ...item,
                                  advancementCount:
                                    typeof value === "number" ? value : null,
                                }
                              : item,
                          ),
                        })
                      }
                    />
                  </Grid.Col>
                </Grid>

                <Divider />

                <Group justify="space-between">
                  <Title order={6}>Format overrides</Title>
                  <Button
                    size="xs"
                    variant="light"
                    leftSection={<IconPlus size={14} />}
                    onClick={() =>
                      onChange({
                        ...state,
                        stages: state.stages.map((item) =>
                          item.localId === stage.localId
                            ? {
                                ...item,
                                overrides: [
                                  ...item.overrides,
                                  {
                                    localId: createLocalId("override"),
                                    round: "",
                                    roundNumber: null,
                                    format: item.defaultFormat,
                                  },
                                ],
                              }
                            : item,
                        ),
                      })
                    }
                  >
                    Add override
                  </Button>
                </Group>

                {stage.overrides.length === 0 ? (
                  <Text size="sm" c="dimmed">
                    No match format overrides.
                  </Text>
                ) : (
                  stage.overrides.map((override) => (
                    <AppSurface key={override.localId} p="sm">
                      <Grid align="end">
                        <Grid.Col span={{ base: 12, md: 4 }}>
                          <TextInput
                            label="Round label"
                            placeholder="final"
                            value={override.round}
                            onChange={(event) =>
                              onChange({
                                ...state,
                                stages: state.stages.map((item) =>
                                  item.localId === stage.localId
                                    ? {
                                        ...item,
                                        overrides: item.overrides.map(
                                          (candidate) =>
                                            candidate.localId === override.localId
                                              ? {
                                                  ...candidate,
                                                  round:
                                                    event.currentTarget.value,
                                                }
                                              : candidate,
                                        ),
                                      }
                                    : item,
                                ),
                              })
                            }
                          />
                        </Grid.Col>

                        <Grid.Col span={{ base: 12, md: 3 }}>
                          <NumberInput
                            label="Round number"
                            min={1}
                            value={numberInputValue(override.roundNumber)}
                            onChange={(value) =>
                              onChange({
                                ...state,
                                stages: state.stages.map((item) =>
                                  item.localId === stage.localId
                                    ? {
                                        ...item,
                                        overrides: item.overrides.map(
                                          (candidate) =>
                                            candidate.localId === override.localId
                                              ? {
                                                  ...candidate,
                                                  roundNumber:
                                                    typeof value === "number"
                                                      ? value
                                                      : null,
                                                }
                                              : candidate,
                                        ),
                                      }
                                    : item,
                                ),
                              })
                            }
                          />
                        </Grid.Col>

                        <Grid.Col span={{ base: 10, md: 4 }}>
                          <Select
                            label="Format"
                            data={matchFormatOptions}
                            value={override.format}
                            onChange={(value) =>
                              onChange({
                                ...state,
                                stages: state.stages.map((item) =>
                                  item.localId === stage.localId
                                    ? {
                                        ...item,
                                        overrides: item.overrides.map(
                                          (candidate) =>
                                            candidate.localId === override.localId
                                              ? {
                                                  ...candidate,
                                                  format: value ?? "",
                                                }
                                              : candidate,
                                        ),
                                      }
                                    : item,
                                ),
                              })
                            }
                          />
                        </Grid.Col>

                        <Grid.Col span={{ base: 2, md: 1 }}>
                          <ActionIcon
                            color="red"
                            variant="light"
                            onClick={() =>
                              onChange({
                                ...state,
                                stages: state.stages.map((item) =>
                                  item.localId === stage.localId
                                    ? {
                                        ...item,
                                        overrides: removeByLocalId(
                                          item.overrides,
                                          override.localId,
                                        ),
                                      }
                                    : item,
                                ),
                              })
                            }
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Grid.Col>
                      </Grid>
                    </AppSurface>
                  ))
                )}
              </Stack>
            </AppSurface>
          ))}
        </Stack>
      </AppSurface>
    </Stack>
  );
}