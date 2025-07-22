
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Clock, GripVertical, EyeOff, Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PopOutButton } from './pop-out-button';

interface TimeZoneConverterProps {
  onPopOut?: () => void;
  isPoppedOut?: boolean;
  onHide?: () => void;
  dragHandleProps?: any;
  isPreview?: boolean;
}

export function TimeZoneConverter({ onPopOut, isPoppedOut = false, onHide, dragHandleProps, isPreview }: TimeZoneConverterProps) {
  const [timezones, setTimezones] = useState<string[]>([]);
  const [fromTz, setFromTz] = useState('');
  const [toTz, setToTz] = useState('');
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState(format(new Date(), 'HH:mm'));
  const [result, setResult] = useState<string | null>(null);
  const [utcResult, setUtcResult] = useState<string | null>(null);
  
  const [fromOpen, setFromOpen] = useState(false)
  const [toOpen, setToOpen] = useState(false)

  useEffect(() => {
    if (isPreview) return;
    // Intl.supportedValuesOf is a modern API, check for existence for older browsers
    if (typeof Intl.supportedValuesOf === 'function') {
      const supportedTimezones = Intl.supportedValuesOf('timeZone');
      setTimezones(supportedTimezones);
      const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setFromTz(userTz);
      setToTz('UTC');
    } else {
        // Fallback for older environments
        const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        setTimezones([userTz, 'UTC', 'America/New_York', 'Europe/London', 'Asia/Tokyo']);
        setFromTz(userTz);
        setToTz('UTC');
    }
  }, [isPreview]);

  useEffect(() => {
    if (date && time && fromTz && toTz) {
      handleConversion();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, time, fromTz, toTz]);
  
  const handleConversion = () => {
    if (!date || !time || !fromTz || !toTz) return;

    const [hours, minutes] = time.split(':').map(Number);
    const fromDate = new Date(date);
    fromDate.setHours(hours, minutes, 0, 0);
    
    // Create a date string in the "from" timezone, which JS can parse
    const formatter = new Intl.DateTimeFormat('en-US', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false,
      timeZone: fromTz,
    });
    
    const parts = formatter.formatToParts(fromDate);
    const dateObj: {[key: string]: string} = {};
    for (const part of parts) {
        if(part.type !== 'literal') {
            dateObj[part.type] = part.value;
        }
    }
    const isoString = `${dateObj.year}-${dateObj.month}-${dateObj.day}T${dateObj.hour}:${dateObj.minute}:${dateObj.second}`;
    const sourceDate = new Date(isoString);

    const targetFormatter = new Intl.DateTimeFormat('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
      timeZone: toTz
    });
    setResult(targetFormatter.format(sourceDate));

    const utcFormatter = new Intl.DateTimeFormat('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
      timeZone: 'UTC'
    });
    setUtcResult(utcFormatter.format(sourceDate));
  };
  
  const TimezoneSelector = ({value, onSelect, open, setOpen}: {value: string, onSelect: (val: string) => void, open: boolean, setOpen: (open: boolean) => void}) => {
    return (
       <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            <span className="truncate">{value || "Select timezone..."}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <Command>
            <CommandInput placeholder="Search timezone..." />
            <CommandList>
              <CommandEmpty>No timezone found.</CommandEmpty>
              <CommandGroup>
                {timezones.map((tz) => (
                  <CommandItem
                    key={tz}
                    value={tz}
                    onSelect={(currentValue) => {
                      onSelect(currentValue === value ? "" : currentValue)
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === tz ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {tz}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <Card className="flex flex-col bg-card/80">
      <CardHeader>
        <div className="flex justify-between items-start">
            <div className="flex items-center gap-2 flex-grow">
               <Button variant="ghost" size="icon" {...dragHandleProps} className="cursor-grab p-1 h-auto w-auto">
                <GripVertical />
              </Button>
              <div className="flex-grow">
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Clock className="h-6 w-6 text-accent" />
                  Time Zone Converter
                </CardTitle>
                <CardDescription>
                  Convert dates and times across the galaxy.
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center">
              {!isPoppedOut && onHide && (
                <Button variant="ghost" size="icon" onClick={onHide}>
                  <EyeOff className="h-4 w-4" />
                </Button>
              )}
              {!isPoppedOut && onPopOut && <PopOutButton onClick={onPopOut} />}
            </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col justify-between">
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {date ? format(date, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={setDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="time">Time</Label>
                    <Input id="time" type="time" value={time} onChange={e => setTime(e.target.value)} />
                </div>
            </div>
            <div className="space-y-2">
                <Label>From</Label>
                <TimezoneSelector value={fromTz} onSelect={setFromTz} open={fromOpen} setOpen={setFromOpen} />
            </div>
            <div className="space-y-2">
                <Label>To</Label>
                <TimezoneSelector value={toTz} onSelect={setToTz} open={toOpen} setOpen={setToOpen}/>
            </div>

            {result && (
                <div className="space-y-2 pt-4">
                    <div className="p-4 rounded-lg border bg-muted">
                        <p className="font-semibold text-lg text-primary">{result}</p>
                        <p className="text-sm text-muted-foreground">in {toTz}</p>
                    </div>
                     <div className="p-4 rounded-lg border">
                        <p className="font-semibold text-md">{utcResult}</p>
                        <p className="text-sm text-muted-foreground">in UTC</p>
                    </div>
                </div>
            )}
        </div>
        <div className="flex justify-end mt-6">
            <Button onClick={handleConversion}>Convert</Button>
        </div>
      </CardContent>
    </Card>
  );
}
